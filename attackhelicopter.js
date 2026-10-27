var invasion = (function () {
	var invasion = {};
	var heliID = "attackhelicopter250375";
	var ignoreClass = "invasion-ignore";
	var fps = 30;
	var flightTime = 1500;
	var gap = 60; // horizontal distance between gun and target
	var heli = null;
	// sounds live next to this script, wherever it is hosted
	var scriptSrc = document.currentScript ? document.currentScript.src : "";
	var baseUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf("/") + 1);
	var frameLines = [
	[
  "                                       ",
	"      ________________________________ ",
	"   /                ||                 ",
	"  x             _--/--\\___             ",
	" / \\\\-----_____|        \\_\\_           ",
	"    `-----ARMY______________)== <--    ",
	"                 __/__\\___             ",
  "                                       "
	],
	[
  "                                       ",
	"      ________________________________ ",
	"   /                ||                 ",
	"  x             _--/--\\___             ",
	" / \\\\-----_____|        \\_\\_           ",
	"    `-----ARMY______________)==        ",
	"                 __/__\\___             ",
  "                                       "
	],[
  "                                       ",
	"        __________________________     ",
	"                    ][                 ",
	" -+-            _--/--\\___             ",
	"   \\\\-----_____|        \\_\\_           ",
	"    `-----ARMY______________)==        ",
	"                 __/__\\___             ",
  "                                       "
	],[
  "                                       ",
	"              ______________           ",
	" \\                  ||                 ",
	"  x             _--/--\\___             ",
	"   \\\\-----_____|        \\_\\_           ",
	"    `-----ARMY______________)==        ",
	"                 __/__\\___             ",
  "                                       "
	],[
  "                                       ",
	"                    __                 ",
	"                    ][                 ",
	" -+-            _--/--\\___             ",
	"   \\\\-----_____|        \\_\\_           ",
	"    `-----ARMY______________)==        ",
	"                 __/__\\___             ",
  "                                       "
	]
	];
	var maskLines = [
  "                                       ",
	" XXX  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
	"XXXXX XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
	"XXXXX          XXXXXXXXXXXX            ",
	"XXXXXXXXXXXXXXXXXXXXXXXXXXXXX          ",
	" XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX       ",
	"    XXXXXXXXXXXXXXXXXXXXXXXXX          ",
  "                XXXXXXXXXXX            ",
	];
	var boomLines = [
	"  \\  |  /  ",
	"-- BOOM! --",
	"  /  |  \\  "
	];
	// reset styles so the host page's CSS for <pre> doesn't mangle the art
	var css =
		"pre." + heliID + "{margin:0;padding:0;border:0;background:rgba(255,255,255,.8);box-shadow:none;" +
		"font:bold 12px/1.15 Menlo,Consolas,monospace;color:#1d2a12;white-space:pre;max-width:none;overflow:visible;}" +
		"pre." + heliID + "." + heliID + "-masked{background:none;}" +
		"pre." + heliID + " span." + heliID + "-solid{background:#ffffffcc;}" +
		"div." + heliID + "-hover{animation:" + heliID + "-hover 1.5s ease-in-out infinite alternate;}" +
		"@keyframes " + heliID + "-hover{from{transform:translateY(-4px)}to{transform:translateY(4px)}}";

	// roughly jQuery's default "swing" easing
	var swing = "cubic-bezier(0.37, 0, 0.63, 1)";

	function create(tag, text) {
		var element = document.createElement(tag);
		if(text !== undefined) {
			element.textContent = text;
		}
		return element;
	}

	function setHidden(element, hidden) {
		element.style.display = hidden ? "none" : "";
	}

	// same test as jQuery's :visible, i.e. the element takes up layout space
	function isVisible(element) {
		return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
	}

	// bounding box in page coordinates
	function pageRect(element) {
		var rect = element.getBoundingClientRect();
		return {left: rect.left + window.scrollX, top: rect.top + window.scrollY, width: rect.width, height: rect.height};
	}

	// Animates inline style properties (values must be CSS strings) from their computed values.
	// The end state is set as inline style up front, so nothing needs to be committed afterwards.
	// The element must be in the document. Returns the Animation; it fires no onfinish when cancelled.
	function tween(element, props, options) {
		var computed = getComputedStyle(element);
		var from = {};
		for(var name in props) {
			from[name] = computed[name];
		}
		Object.assign(element.style, props);
		return element.animate([from, props], {
			duration: options.duration,
			delay: options.delay || 0,
			easing: options.easing || swing,
			fill: "backwards" // show the start state during the delay
		});
	}

	// Fills `pre` with `lines`; characters under an X in `mask` get an opaque white background.
	function drawMasked(pre, lines, mask) {
		pre.classList.add(heliID + "-masked");
		lines.forEach(function(line, r) {
			if(r > 0) {
				pre.appendChild(document.createTextNode("\n"));
			}
			var start = 0;
			while(start < line.length) {
				var filled = mask[r].charAt(start) == "X";
				var end = start + 1;
				while(end < line.length && (mask[r].charAt(end) == "X") == filled) {
					end++;
				}
				var run = line.substring(start, end);
				if(filled) {
					var span = create("span", run);
					span.classList.add(heliID + "-solid");
					pre.appendChild(span);
				}
				else {
					pre.appendChild(document.createTextNode(run));
				}
				start = end;
			}
		});
	}

	function topLayer(element) {
		element.classList.add(heliID);
		Object.assign(element.style, {
			"position": "absolute",
			"zIndex": 2147483647,
			"pointerEvents": "none"
		});
		return element;
	}

	invasion.AttackHelicopter = function () {

		var self = this;

		self.shooting = false;

		self.stopped = false;

		self.container = null;

		self.frames = [];

		self.current = 0;

		self.timer = null;

		self.guns = new Audio(baseUrl + "gun.mp3");

		self.radio = new Audio(baseUrl + "radio.mp3");

		self.wagner = new Audio(baseUrl + "wagner_comp.mp3");

		self.step = function() {
			// hide old frame
			setHidden(self.frames[self.current], true);
			self.current = (self.current + 1) % self.frames.length;
			if(self.current == 0 && !self.shooting) {
				self.current = 1; // skip the shooting frame
			}
			if(self.current == 1 && self.shooting) {
				self.current = 2; // skip the first non-shooting frame
			}
			// show new frame
			setHidden(self.frames[self.current], false);
		};

		// play a sound and continue after a fixed time, even if the browser refuses to play it
		self.play = function(audio, duration, callback) {
			audio.currentTime = 0;
			var played = audio.play();
			if(played && played.catch) {
				played.catch(function() {});
			}
			setTimeout(function() {
				if(!self.stopped) {
					callback();
				}
			}, duration);
		};

		self.useGun = function(target, callback) {
			self.shooting = true;
			var bullets = setInterval(function() {
				self.fireBullet(target);
			}, 90);
			self.play(self.guns, 1300, function() {
				self.shooting = false;
				clearInterval(bullets);
				callback();
			});
		};

		self.useRadio = function(callback) {
			self.play(self.radio, 2000, callback);
		};

		self.gunPosition = function() {
			var offset = pageRect(self.container);
			return {
				x: offset.left + self.container.offsetWidth * 0.86,
				y: offset.top + self.container.offsetHeight * 0.75
			};
		};

		self.fireBullet = function(target) {
			var gun = self.gunPosition();
			var rect = target.rect;
			var bullet = topLayer(create("span", "—"));
			Object.assign(bullet.style, {
				"left": gun.x + "px",
				"top": (gun.y - 8) + "px",
				"font": "bold 14px monospace",
				"color": "#c1121f"
			});
			document.documentElement.appendChild(bullet);
			tween(bullet, {
				"left": (rect.left + Math.random() * Math.min(rect.width, 80)) + "px",
				"top": (rect.top + Math.random() * rect.height - 8) + "px"
			}, {duration: 160, easing: "linear"}).onfinish = function() {
				bullet.remove();
			};
		};

		self.explode = function(target) {
			var rect = target.rect;
			var boom = topLayer(create("pre", boomLines.join("\n")));
			boom.style.color = "#c1121f";
			document.documentElement.appendChild(boom);
			Object.assign(boom.style, {
				"left": (rect.left + Math.min(rect.width, 160) / 2 - boom.offsetWidth / 2) + "px",
				"top": (rect.top + rect.height / 2 - boom.offsetHeight / 2) + "px"
			});
			tween(boom, {"opacity": "0"}, {delay: 300, duration: 500}).onfinish = function() {
				boom.remove();
			};
		};

		self.init = function() {
			if(!document.getElementById(heliID + "-style")) {
				var style = create("style", css);
				style.id = heliID + "-style";
				document.head.appendChild(style);
			}

			// create helicopter container; it lives on <html> so it is positioned in page coordinates
			// even when <body> is positioned
			self.container = topLayer(create("div"));
			Object.assign(self.container.style, {
				"left": (window.scrollX + 20) + "px",
				"top": (window.scrollY + 80) + "px"
			});
			var hover = create("div");
			hover.classList.add(heliID + "-hover");
			self.container.appendChild(hover);
			document.documentElement.appendChild(self.container);

			// create helicopter ascii art frames
			for(var frame = 0; frame < frameLines.length; frame++) {
				var pre = create("pre");
				drawMasked(pre, frameLines[frame], maskLines);
				pre.classList.add(heliID);
				setHidden(pre, true);
				self.frames.push(pre);
				hover.appendChild(pre);
			}
			setHidden(self.frames[1], false);

			// Schedule step function
			self.timer = setInterval(self.step, 1000/fps);

			self.wagner.play().catch(function() {});
		};

		self.acquireTarget = function() {
			// select a random visible element without visible children; once all of an element's
			// children are destroyed, the element itself becomes a target
			var targets = Array.prototype.filter.call(document.body.querySelectorAll("*"), function(element) {
				if(element.matches("script, style, noscript, template, link, meta, br, svg *")) {
					return false;
				}
				if(element.closest("." + heliID + ", ." + ignoreClass)) {
					return false;
				}
				if(!isVisible(element) || getComputedStyle(element).visibility == "hidden") {
					return false;
				}
				if(element.tagName.toLowerCase() != "svg" && Array.prototype.some.call(element.children, isVisible)) {
					return false;
				}
				var rect = element.getBoundingClientRect();
				return rect.width > 0 && rect.height > 0;
			});
			if(targets.length == 0) {
				return null;
			}
			var element = targets[Math.floor(Math.random() * targets.length)];
			return {
				element: element,
				rect: pageRect(element)
			};
		};

		self.attack = function () {
			if(self.stopped) {
				return;
			}
			// 1: acquire a target
			var target = self.acquireTarget();
			if(target == null) {
				self.victory();
				return;
			}
			var rect = target.rect;
			// 2: move to target, so the gun is a short distance left of it
			var gunOffsetX = self.container.offsetWidth * 0.86;
			var gunOffsetY = self.container.offsetHeight * 0.75;
			var left = Math.max(0, rect.left - gap - gunOffsetX);
			var top = Math.max(0, rect.top + Math.min(rect.height, 200) / 2 - gunOffsetY);
			// only scroll when the target isn't already on screen
			var scrollTop = window.scrollY;
			if(rect.top < scrollTop || rect.top + rect.height > scrollTop + window.innerHeight) {
				window.scrollTo({top: Math.max(0, top - window.innerHeight / 3), behavior: "smooth"});
			}
			self.moveTo("left", left, function() {
				self.moveTo("top", top, function() {
					// 3: Radio target to base
					self.useRadio(function() {
						// 4: Shoot the target
						self.useGun(target, function() {
							// 5: Remove target from DOM
							self.explode(target);
							tween(target.element, {"opacity": "0"}, {duration: 400}).onfinish = function() {
								target.element.remove();
								// 6: Call attack again on finished
								self.attack();
							};
						});
					});
				});
			});
		};

		self.moveTo = function(property, value, callback) {
			var properties = {};
			properties[property] = value + "px";
			tween(self.container, properties, {duration: flightTime}).onfinish = function() {
				if(!self.stopped) {
					callback();
				}
			};
		};

		self.victory = function() {
			var banner = create("pre", "\n   *** MISSION ACCOMPLISHED ***");
			banner.classList.add(heliID);
			banner.style.color = "#c1121f";
			self.container.querySelector("div").appendChild(banner);
			tween(self.container, {
				"left": (window.scrollX + 40) + "px",
				"top": (window.scrollY + 40) + "px"
			}, {duration: 2000});
		};

		self.stop = function() {
			self.stopped = true;
			clearInterval(self.timer);
			[self.guns, self.radio, self.wagner].forEach(function(audio) {
				audio.pause();
			});
			document.querySelectorAll("." + heliID).forEach(function(element) {
				element.getAnimations().forEach(function(animation) {
					animation.cancel();
				});
				element.remove();
			});
		};

		self.init();
		self.attack();
	};

	invasion.launch = function() {
		if(heli == null) {
			heli = new invasion.AttackHelicopter();
		}
	};

	invasion.abort = function() {
		if(heli != null) {
			heli.stop();
			heli = null;
		}
	};

	invasion.isRunning = function() {
		return heli != null;
	};

	// launch or abort; returns whether the helicopter is now flying
	invasion.toggle = function() {
		if(invasion.isRunning()) {
			invasion.abort();
		}
		else {
			invasion.launch();
		}
		return invasion.isRunning();
	};

	// a floating button, used by the bookmarklet to add a launch control to any page
	invasion.addLaunchButton = function() {
		var id = heliID + "-launch";
		if(document.getElementById(id)) {
			return;
		}
		var launchText = "🚁 Launch Attack Helicopter";
		var button = create("button", launchText);
		button.type = "button";
		button.id = id;
		button.classList.add(ignoreClass);
		Object.assign(button.style, {
			"position": "fixed",
			"right": "16px",
			"bottom": "16px",
			"zIndex": 2147483647,
			"padding": "10px 16px",
			"border": "2px solid #1d2a12",
			"borderRadius": "6px",
			"background": "#4b5d2a",
			"color": "#fff",
			"font": "bold 14px/1.2 system-ui, sans-serif",
			"cursor": "pointer",
			"boxShadow": "0 4px 12px rgba(0,0,0,.3)"
		});
		button.addEventListener("click", function() {
			button.textContent = invasion.toggle() ? "Abort mission" : launchText;
		});
		document.body.appendChild(button);
	};

	return invasion;
}());
