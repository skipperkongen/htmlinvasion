var invasion = (function ($) {
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
	"     ________________________________",
	"  /                ||                ",
	" x             _--/--\\___            ",
	"/ \\\\-----_____|        \\_\\_          ",
	"   `-----ARMY______________)== <--   ",
	"                __/__\\___            "
	],
	[
	"     ________________________________",
	"  /                ||                ",
	" x             _--/--\\___            ",
	"/ \\\\-----_____|        \\_\\_          ",
	"   `-----ARMY______________)==       ",
	"                __/__\\___            "
	],[
	"       __________________________    ",
	"                   ][                ",
	"-+-            _--/--\\___            ",
	"  \\\\-----_____|        \\_\\_          ",
	"   `-----ARMY______________)==       ",
	"                __/__\\___            "
	],[
	"             ______________          ",
	"\\                  ||                ",
	" x             _--/--\\___            ",
	"  \\\\-----_____|        \\_\\_          ",
	"   `-----ARMY______________)==       ",
	"                __/__\\___            "
	],[
	"                   __                ",
	"                   ][                ",
	"-+-            _--/--\\___            ",
	"  \\\\-----_____|        \\_\\_          ",
	"   `-----ARMY______________)==       ",
	"                __/__\\___            "
	]
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
		"div." + heliID + "-hover{animation:" + heliID + "-hover 1.5s ease-in-out infinite alternate;}" +
		"@keyframes " + heliID + "-hover{from{transform:translateY(-4px)}to{transform:translateY(4px)}}";

	function topLayer(element) {
		return element.addClass(heliID).css({
			"position": "absolute",
			"zIndex": 2147483647,
			"pointerEvents": "none"
		});
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
			$(self.frames[self.current]).hide();
			self.current = (self.current + 1) % self.frames.length;
			if(self.current == 0 && !self.shooting) {
				self.current = 1; // skip the shooting frame
			}
			if(self.current == 1 && self.shooting) {
				self.current = 2; // skip the first non-shooting frame
			}
			// show new frame
			$(self.frames[self.current]).show();
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
			var offset = self.container.offset();
			return {
				x: offset.left + self.container.outerWidth() * 0.86,
				y: offset.top + self.container.outerHeight() * 0.75
			};
		};

		self.fireBullet = function(target) {
			var gun = self.gunPosition();
			var rect = target.rect;
			var bullet = topLayer($("<span/>"))
				.text("—")
				.css({
					"left": gun.x + "px",
					"top": (gun.y - 8) + "px",
					"font": "bold 14px monospace",
					"color": "#c1121f"
				});
			$(document.documentElement).append(bullet);
			bullet.animate({
				"left": rect.left + Math.random() * Math.min(rect.width, 80),
				"top": rect.top + Math.random() * rect.height - 8
			}, 160, "linear", function() {
				bullet.remove();
			});
		};

		self.explode = function(target) {
			var rect = target.rect;
			var boom = topLayer($("<pre/>")).text(boomLines.join("\n")).css("color", "#c1121f");
			$(document.documentElement).append(boom);
			boom.css({
				"left": (rect.left + Math.min(rect.width, 160) / 2 - boom.outerWidth() / 2) + "px",
				"top": (rect.top + rect.height / 2 - boom.outerHeight() / 2) + "px"
			});
			boom.delay(300).fadeOut(500, function() {
				boom.remove();
			});
		};

		self.init = function() {
			if(!$("#" + heliID + "-style").length) {
				$("<style/>").attr("id", heliID + "-style").text(css).appendTo("head");
			}

			// create helicopter container; it lives on <html> so it is positioned in page coordinates
			// even when <body> is positioned
			self.container = topLayer($("<div/>"))
				.css({
					"left": ($(window).scrollLeft() + 20) + "px",
					"top": ($(window).scrollTop() + 80) + "px"
				});
			var hover = $("<div/>").addClass(heliID + "-hover");
			self.container.append(hover);
			$(document.documentElement).append(self.container);

			// create helicopter ascii art frames
			for(var frame = 0; frame < frameLines.length; frame++) {
				var pre = $("<pre/>").addClass(heliID).text(frameLines[frame].join("\n")).hide();
				self.frames.push(pre);
				hover.append(pre);
			}
			$(self.frames[1]).show();

			// Schedule step function
			self.timer = setInterval(self.step, 1000/fps);

			self.wagner.play().catch(function() {});
		};

		self.acquireTarget = function() {
			// select a random visible element without visible children; once all of an element's
			// children are destroyed, the element itself becomes a target
			var targets = $("body *")
				.not("script, style, noscript, template, link, meta, br, svg *")
				.filter(function() {
					var element = $(this);
					if(element.closest("." + heliID + ", ." + ignoreClass).length) {
						return false;
					}
					if(!element.is(":visible") || element.css("visibility") == "hidden") {
						return false;
					}
					if(this.tagName.toLowerCase() != "svg" && element.children(":visible").length) {
						return false;
					}
					var rect = this.getBoundingClientRect();
					return rect.width > 0 && rect.height > 0;
				});
			if(targets.length == 0) {
				return null;
			}
			var element = $(targets[Math.floor(Math.random() * targets.length)]);
			var offset = element.offset();
			var size = element[0].getBoundingClientRect();
			return {
				element: element,
				rect: {left: offset.left, top: offset.top, width: size.width, height: size.height}
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
			var gunOffsetX = self.container.outerWidth() * 0.86;
			var gunOffsetY = self.container.outerHeight() * 0.75;
			var left = Math.max(0, rect.left - gap - gunOffsetX);
			var top = Math.max(0, rect.top + Math.min(rect.height, 200) / 2 - gunOffsetY);
			// only scroll when the target isn't already on screen
			var scrollTop = $(window).scrollTop();
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
							target.element.fadeOut(function() {
								$(this).remove();
								// 6: Call attack again on finished
								self.attack();
							});
						});
					});
				});
			});
		};

		self.moveTo = function(property, value, callback) {
			var properties = {};
			properties[property] = value + "px";
			self.container.animate(properties, flightTime, function() {
				if(!self.stopped) {
					callback();
				}
			});
		};

		self.victory = function() {
			var banner = $("<pre/>").addClass(heliID).text("\n   *** MISSION ACCOMPLISHED ***").css("color", "#c1121f");
			self.container.find("div").append(banner);
			self.container.animate({
				"left": ($(window).scrollLeft() + 40) + "px",
				"top": ($(window).scrollTop() + 40) + "px"
			}, 2000);
		};

		self.stop = function() {
			self.stopped = true;
			clearInterval(self.timer);
			$.each([self.guns, self.radio, self.wagner], function(i, audio) {
				audio.pause();
			});
			$("." + heliID).stop(true).remove();
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
		if($("#" + id).length) {
			return;
		}
		var launchText = "🚁 Launch Attack Helicopter";
		var button = $("<button type=\"button\"/>")
			.attr("id", id)
			.addClass(ignoreClass)
			.text(launchText)
			.css({
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
			})
			.on("click", function() {
				button.text(invasion.toggle() ? "Abort mission" : launchText);
			});
		$("body").append(button);
	};

	return invasion;
}(jQuery));
