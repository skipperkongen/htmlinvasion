var invasion = (function () {
	var invasion = {};
	var heliID = "attackhelicopter250375";
	var ignoreClass = "invasion-ignore";
	var fps = 30;
	var flightTime = 1500;
	var gap = 60; // horizontal distance between gun and target
	var helis = new Set(); // helicopters that are flying
	var claimed = new Set(); // elements some helicopter is about to destroy
	var launched = 0;
	var wagner = null; // one soundtrack shared by all helicopters
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

	// `owner` marks the element as belonging to one helicopter, so stop() only removes its own
	function topLayer(element, owner) {
		element.classList.add(heliID, owner);
		Object.assign(element.style, {
			"position": "absolute",
			"zIndex": 2147483647,
			"pointerEvents": "none"
		});
		return element;
	}

	invasion.AttackHelicopter = function () {

		var self = this;

		self.owner = heliID + "-" + (++launched);

		// offsets helicopters from each other so they don't overlap exactly
		self.slot = helis.size % 5;
		helis.add(self);

		self.shooting = false;

		self.stopped = false;

		self.container = null;

		self.frames = [];

		self.current = 0;

		self.timer = null;

		self.bullets = null;

		self.target = null;

		self.guns = new Audio(baseUrl + "gun.mp3");

		self.radio = new Audio(baseUrl + "radio.mp3");

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
			self.bullets = setInterval(function() {
				self.fireBullet(target);
			}, 90);
			self.play(self.guns, 1300, function() {
				self.shooting = false;
				clearInterval(self.bullets);
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
			var bullet = topLayer(create("span", "—"), self.owner);
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
			var boom = topLayer(create("pre", boomLines.join("\n")), self.owner);
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
			self.container = topLayer(create("div"), self.owner);
			Object.assign(self.container.style, {
				"left": (window.scrollX + 20 + self.slot * 40) + "px",
				"top": (window.scrollY + 80 + self.slot * 40) + "px"
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

			if(helis.size == 1) {
				wagner = wagner || new Audio(baseUrl + "wagner_comp.mp3");
				wagner.currentTime = 0;
				wagner.play().catch(function() {});
			}
		};

		self.acquireTarget = function() {
			// select a random visible element without visible children; once all of an element's
			// children are destroyed, the element itself becomes a target
			var targets = Array.prototype.filter.call(document.body.querySelectorAll("*"), function(element) {
				if(element.matches("script, style, noscript, template, link, meta, br, svg *")) {
					return false;
				}
				if(element.closest("." + heliID + ", ." + ignoreClass) || claimed.has(element)) {
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
				if(claimed.size > 0) {
					// the rest is being shot by other helicopters; check again when they are done
					setTimeout(self.attack, 500);
				}
				else {
					self.victory();
				}
				return;
			}
			self.target = target;
			claimed.add(target.element);
			var rect = target.rect;
			// 2: move to target, so the gun is a short distance left of it
			var gunOffsetX = self.container.offsetWidth * 0.86;
			var gunOffsetY = self.container.offsetHeight * 0.75;
			var left = Math.max(0, rect.left - gap - gunOffsetX);
			var top = Math.max(0, rect.top + Math.min(rect.height, 200) / 2 - gunOffsetY);
			// only scroll when the target isn't already on screen, and never with several helicopters
			var scrollTop = window.scrollY;
			if(helis.size == 1 && (rect.top < scrollTop || rect.top + rect.height > scrollTop + window.innerHeight)) {
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
							// stays claimed until it is gone, even if this helicopter is stopped meanwhile
							self.target = null;
							tween(target.element, {"opacity": "0"}, {duration: 400}).onfinish = function() {
								target.element.remove();
								claimed.delete(target.element);
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
				"left": (window.scrollX + 40 + self.slot * 40) + "px",
				"top": (window.scrollY + 40 + self.slot * 40) + "px"
			}, {duration: 2000});
		};

		self.stop = function() {
			self.stopped = true;
			helis.delete(self);
			if(self.target) {
				claimed.delete(self.target.element);
				self.target = null;
			}
			clearInterval(self.timer);
			clearInterval(self.bullets);
			[self.guns, self.radio].forEach(function(audio) {
				audio.pause();
			});
			if(helis.size == 0 && wagner) {
				wagner.pause();
			}
			document.querySelectorAll("." + self.owner).forEach(function(element) {
				element.getAnimations().forEach(function(animation) {
					animation.cancel();
				});
				element.remove();
			});
		};

		self.init();
		self.attack();
	};

	// launches one more helicopter and returns it
	invasion.launch = function() {
		var heli = new invasion.AttackHelicopter();
		if(helis.size > 1) {
			// cancel a smooth scroll that is still running
			window.scrollTo({left: window.scrollX, top: window.scrollY, behavior: "instant"});
		}
		return heli;
	};

	// stops all helicopters
	invasion.abort = function() {
		Array.from(helis).forEach(function(heli) {
			heli.stop();
		});
	};

	invasion.isRunning = function() {
		return helis.size > 0;
	};

	// floating buttons, used by the bookmarklet to add launch controls to any page
	invasion.addLaunchButton = function() {
		var id = heliID + "-controls";
		if(document.getElementById(id)) {
			return;
		}
		var controls = create("div");
		controls.id = id;
		controls.classList.add(ignoreClass);
		Object.assign(controls.style, {
			"position": "fixed",
			"right": "16px",
			"bottom": "16px",
			"zIndex": 2147483647,
			"display": "flex",
			"gap": "8px"
		});

		function addButton(text, background, onclick) {
			var button = create("button", text);
			button.type = "button";
			Object.assign(button.style, {
				"padding": "10px 16px",
				"border": "2px solid #1d2a12",
				"borderRadius": "6px",
				"background": background,
				"color": "#fff",
				"font": "bold 14px/1.2 system-ui, sans-serif",
				"cursor": "pointer",
				"boxShadow": "0 4px 12px rgba(0,0,0,.3)"
			});
			button.addEventListener("click", onclick);
			controls.appendChild(button);
			return button;
		}

		function update() {
			abort.disabled = !invasion.isRunning();
			abort.style.opacity = abort.disabled ? "0.5" : "1";
			abort.style.cursor = abort.disabled ? "default" : "pointer";
		}

		addButton("🚁 Launch Attack Helicopter", "#4b5d2a", function() {
			invasion.launch();
			update();
		});
		var abort = addButton("Abort mission", "#7a1f1f", function() {
			invasion.abort();
			update();
		});
		update();
		document.body.appendChild(controls);
	};

	return invasion;
}());
