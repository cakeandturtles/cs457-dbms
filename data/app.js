var app = module.exports = require('appjs');
app.serveFilesFrom(__dirname + '/content');

var new_window = null;

//handle requests from the browser
app.router.post('/', function(request, response, next){
	new_window = app.createWindow(
	__dirname + '/content/result.html',
	{
		width  : 460,
		height : 640,
		icons  : __dirname + '/content/icons'
	});
	window.console.log(new_window);
	new_window.on('create', function(){
		window.console.log("New Window Created");
		// window.frame controls the desktop window
		new_window.frame.show().center();
	});
	
	new_window.on('ready', function(){
		new_window.console.log("Window Ready");
		var query = unescape(request['post'].slice(6).replace(/\+/g, " "));
		new_window.document.getElementById("query").innerHTML = query;
		new_window.main();
		
		new_window.process = process;
		new_window.module = module;
		
		function F12(e){ return e.keyIdentifier === 'F12' }
		function Command_Option_J(e){ return e.keyCode === 74 && e.metaKey && e.altKey }
		
		new_window.addEventListener('keydown', function(e){
			if (F12(e) || Command_Option_J(e)) {
				new_window.frame.openDevTools();
			}
		});
	});
	
	new_window.on('close', function(){
		window.console.log("New Window Closed");
		new_window = null;
	});
});


var menubar = app.createMenu([{
  label:'&File',
  submenu:[
    {
      label:'E&xit',
      action: function(){
        window.close();
      }
    }
  ]
},{
  label:'&Window',
  submenu:[
    {
      label:'Fullscreen',
      action:function(item) {
        window.frame.fullscreen();
        window.console.log(item.label+" called.");
      }
    },
    {
      label:'Minimize',
      action:function(){
        window.frame.minimize();
      }
    },
    {
      label:'Maximize',
      action:function(){
        window.frame.maximize();
      }
    },{
      label:''//separator
    },{
      label:'Restore',
      action:function(){
        window.frame.restore();
      }
    }
  ]
}]);

menubar.on('select',function(item){
  window.console.log("menu item "+item.label+" clicked");
});

var trayMenu = app.createMenu([{
  label:'Show',
  action:function(){
    window.frame.show();
  },
},{
  label:'Minimize',
  action:function(){
    window.frame.hide();
  }
},{
  label:'Exit',
  action:function(){
    window.close();
  }
}]);

var statusIcon = app.createStatusIcon({
  icon:'./data/content/icons/32.png',
  tooltip:'CS457 DBMS - Jake Trower',
  menu:trayMenu
});

var window = app.createWindow({
  width  : 640,
  height : 460,
  icons  : __dirname + '/content/icons'
});

window.on('create', function(){
  console.log("Window Created");
  window.frame.show();
  window.frame.center();
  window.frame.setMenuBar(menubar);
});

window.on('ready', function(){
  window.console.log("Window Ready");
  window.process = process;
  window.module = module;

  function F12(e){ return e.keyIdentifier === 'F12' }
  function Command_Option_J(e){ return e.keyCode === 74 && e.metaKey && e.altKey }

  window.addEventListener('keydown', function(e){
    if (F12(e) || Command_Option_J(e)) {
      window.frame.openDevTools();
    }
  });
});

window.on('close', function(){
  if (new_window != null){
    new_window.close();
  }
  statusIcon.hide();
  window.console.log("Window Closed");
});
