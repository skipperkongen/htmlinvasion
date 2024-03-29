var heli;

$(function() {
		
	heli = new invasion.AttackHelicopter();

});

var invasion = (function ($) {
	var invasion = {};
	var gravityVectorX = 0;
	var gravityVectorY = -10;
	var self;
	var initialized = false;
	var heliID = "attackhelicopter250375";
	var fps = 30;
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
	
	invasion.AttackHelicopter = function () {
		
		self = this;
		
		self.shooting = false;
		
		self.hoverUp = true;
		
		self.container = null;
		
		self.frames = [];
		
		self.current = 0;
		
		self.guns = null;
		
		self.radio = null;
		
		self.wagner = null;
		
		//self.helisound = null;
		
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
		}
		
		self.useGun = function(callback) {
			self.shooting = true;
			self.guns.play();
			// TODO: Change to use onended event from player
			setTimeout(function(){
				self.shooting = false;
				if(typeof(callback) != "undefined") {
					callback();
				}
			}, 1300);
			

		};
				
		self.useRadio = function(callback) {
			self.radio.play();
			setTimeout(function() {
				if(typeof(callback) != "undefined") {
					callback();
				}				
			}, 2000);

		};
			
		self.init = function() {
			if(!initialized) {
				
				// make audio elements and add to body
				self.guns = $('<audio preload="auto" src="audio/gun.mp3" />').addClass(heliID)[0];
				self.radio = $('<audio preload="auto" src="audio/radio.mp3" />').addClass(heliID)[0];
				self.wagner = $('<audio preload="auto" src="audio/wagner_comp.mp3" loop="loop" autoplay="autoplay"/>').addClass(heliID)[0];
				//self.helisound = $('<audio preload="auto" src="audio/heli.mp3" loop="loop" autoplay="autoplay"/>').addClass(heliID)[0];
				$("body").append(self.guns);
				$("body").append(self.radio);
				//$("body").append(self.helisound);
				$("body").append(self.wagner);
				
				// create helicopter container
				self.container = $("<div/>").addClass(heliID);
				self.container.css("position", "absolute");
				self.container.css("top", "100px").css("left", "300px");
				$('body').append(self.container);
				
				// create helicopter ascii art frames
				for(var frame in frameLines) {
					// style="font-weight: bold; font-size: 12px; font-familiy: monospace;"
					var pre = $('<pre />').addClass(heliID).hide();
					self.frames.push(pre);
					$("div." + heliID).append(pre);
					var lines = frameLines[frame];
					for(var line in lines) {
						pre.append(lines[line] + '\n');
					}
				}
				
				// Schedule step function
				setInterval(function() {self.step()}, 1000/fps);
				
				self.hover();
								
				initialized = true;
				}
			};
		
		self.acquireTarget = function() {
			// select a random html element that has no children, and is a child of body
			var targets = $("body *:not(." + heliID + "):not(:has(*))");
			var rand = Math.floor(Math.random() * targets.length);
			var target = targets.length == 0 ? targets : $(targets[rand]); 
			return target;
		}
		
		self.attack = function () {
			// 1: acquire a target
			var target = self.acquireTarget();
			if(target.length == 0) {
				self.container.animate({"left": "100px", "top":"100px"}, 2000);
				$('body').append("Victory!"); 
				return;
			}
			var targetX = target.position().left;
			var targetY = target.position().top + target.height()/2;
			var gunX = self.container.position().left + self.container.width()/2;
			var gunY = self.container.position().top + self.container.height()/2;
			var deltaX = targetX - gunX;
			var deltaY = targetY - gunY;
			// 2: move to target. Lower right should be 10 px from target
			self.moveRight(deltaX, function() {
				self.moveDown(deltaY, function() {
					// 3: Radio target to base
					self.useRadio(function(){
						// 4: Shoot the target
						self.useGun(function() {
							// 5: Remove target from DOM
							$(target).fadeOut( function() { 
								$(this).remove();
								// 6: Call attack again on finished
								self.attack();
							});
						});
					});				
				});
			});
		};
		
		self.hover = function() {
			if(self.hoverUp) {
				self.moveUp(7, self.hover);
			}
			else {
				self.moveDown(7, self.hover);
			}
			self.hoverUp = !self.hoverUp;
			
		}
		
		self.moveRight = function (distance, callback) {
			self.container.animate({"left":"+="+distance+"px"}, 1500, callback);
		};
		
		self.moveLeft = function (distance, callback) {
			self.container.animate({"left":"-="+distance+"px"}, 1500, callback);
		};
		
		self.moveUp = function (distance, callback) {
			self.container.animate({"top":"-="+distance+"px"}, 1500, callback);
		};
		
		self.moveDown = function (distance, callback) {
			self.container.animate({"top":"+="+distance+"px"}, 1500, callback);
		};
		
		self.init();
		self.attack();
	};
	
	return invasion;
}(jQuery));


		
