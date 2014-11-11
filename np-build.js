#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander');
program
  .version('0.0.1')
  .option('-u, --user [type]', 'crea un utente [admin]', 'user')
  .option('-n, --name [type]', 'crea un dominio', 'domainname');

if (process.argv.length < 3) {
	program.help();
}

program.parse(process.argv);
var username = program.user;
var domainname = program.domainname; 
console.log(username+domainname);

var menu = require('terminal-menu')({ width: 75, x: 0, y: 0 });
menu.reset();
menu.write('np-build is a command line tool for creating vesta control panel hosting\n');
menu.write('-------------------------\n');

menu.add('1 . Crea hosting e database');
menu.add('2 . Crea hosting, database e install wordpress');
menu.add('3 . Crea soltanto l\'hosting');
menu.add('Quit');

menu.on('select', function (label) {
    menu.close();
    console.log('SELECTED: ' + label);
    var scelta = label.substring(0,1);

   	switch(scelta) {
   	    case '1':
   	    	creahosting();
   	    	creadb();  	
   	        break;
   	    case '2':
   	    	creahosting();
   	    	creadb();
   	    	installwp();
   	        break;
   	    case '3':
   	    	creahosting();
   	    	break;
   	}
    

});
menu.createStream().pipe(process.stdout);

var generatePassword = require('password-generator');

function creahosting(user, domain) {
	var password = generatePassword(12,false);
	console.log('crea hosting');
	console.log(password);
}

function creadb (user) {
	console.log('crea db');
}

function installwp (user) {
	console.log('installa wp');
}