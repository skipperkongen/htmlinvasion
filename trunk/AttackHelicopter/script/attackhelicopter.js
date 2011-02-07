
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
	
	invasion.AttackHelicopter = function (options) {
		
		self = this;

		self.enginePct = 0.5; // 1.0 is full on, 0.0 is full off.
		self.tilt = 0;
		
		self.shooting = false;
		
		self.hoverUp = true;
		
		self.container = null;
		
		self.frames = [];
		
		self.current = 0;
		
		self.guns = null;
		
		self.radio = null;
		
		self.helisound = null;
		
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
		
		self.useGun = function() {
			self.shooting = true;
			setTimeout(function(){self.shooting = false}, 1300);
			self.guns.play();
		};
				
		self.useRadio = function() {
			self.radio.play();
		};
			
		self.init = function() {
			if(!initialized) {
				
				// make audio elements and add to body
				self.guns = $('<audio preload="auto" src="audio/gun.mp3" />')[0];
				self.radio = $('<audio preload="auto" src="audio/radio.mp3" />')[0];
				self.helisound = $('<audio preload="auto" src="audio/heli.mp3" loop="loop" /*autoplay="autoplay"*/ />')[0];
				$("body").append(self.guns);
				$("body").append(self.radio);
				$("body").append(self.helisound);
				
				// create helicopter container
				self.container = $('<div id="' + heliID + '" />');
				self.container.css("position", "absolute");
				self.container.css("top", "100px").css("left", "300px");
				$('body').append(self.container);
				
				// create helicopter ascii art frames
				for(var frame in frameLines) {
					var pre = $('<pre style="font-weight: bold; font-size: 12px; font-familiy: monospace;"/>').hide();
					self.frames.push(pre);
					$("#" + heliID).append(pre);
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
		
		self.aquiteRandomTarget = function() {
			
		}
		
		self.hover = function() {
			
			
		}
			
		self.attack = function () {
			
		};
		
		self.moveRight = function (distance) {
			self.container.animate({"left":"+="+distance+"px"}, 3000);
		};
		
		self.moveLeft = function (distance) {
			self.container.animate({"left":"-="+distance+"px"}, 3000);
		};
		
		self.moveUp = function (distance) {
			self.container.animate({"top":"-="+distance+"px"}, 3000);
		};
		
		self.moveDown = function (distance) {
			self.container.animate({"top":"+="+distance+"px"}, 3000);
		};		
	};
	
	return invasion;
}(jQuery));


		
