#!/usr/bin/env node

/**
 * Module dependencies.
 */

 var program = require('commander');
 var nconf = require('nconf');
 var siteconf = require('nconf');
 var os = require("os");
 var fs = require('fs');
 var generatePassword = require('password-generator');
 var sys = require('sys')
 var exec = require('child_process').exec;
 var child;
 var network = require('network');
 var myip = network.get_public_ip(function(err, ip) {
 })

 program
 .version('0.0.1')
 .option('-u, --user [string]', 'crea un utente', 'admin')
 .option('-n, --domainname [string]', 'crea un dominio', os.hostname());

 if (process.argv.length < 3) {
  program.help();
}

if (!(fs.existsSync('./config.json'))) {
 
   console.log('non hai un file di configurazione, lo creo...');
    nconf.use('file', { file: './config.json' });
    nconf.load();
    nconf.set('ip', +myip);
    nconf.set('hostname', os.hostname());
    nconf.set('email', '');
    nconf.set('wp_user', '');
    nconf.save(function (err) {
      if (err) {
        console.error(err.message);
        return;
      }
      console.log('Configuration saved successfully.');
    });
  } 
  else {
    nconf.use('file', { file: './config.json' });
  nconf.load();
    
program.parse(process.argv);
var username = program.user;
var domainname = program.domainname; 


var menu = require('terminal-menu')({ width: process.stdout.columns - 4, x: 0, y: 0 });
menu.reset();
menu.write('np-build is a tool for vesta cp\n');
menu.write('-------------------------\n');

menu.add('1 . Crea hosting e database');
menu.add('2 . Crea hosting, database e install wordpress');
menu.add('3 . Crea soltanto l\'hosting');
menu.add('Quit');

menu.on('select', function (label) {
    menu.close();
    console.log('SELECTED: ' + label);
    var scelta = label.substring(0,1);
    siteconf.use('file', { file: username+'.json', dir:'config_web/', search:true });
    siteconf.load();
   	switch(scelta) {
   	    case '1':
          creautente(username);
   	    	creahosting(username, domainname);
   	    	creadb(username);
          salvaConfig();  	
   	        break;
   	    case '2':
          creautente(username);
          creahosting(username, domainname);
          creadb(username);
   	    	installwp();
          salvaConfig(); 
   	        break;
   	    case '3':
          creautente(username);
          creahosting(username, domainname);
          salvaConfig(); 
   	    	break;
   	}
    

});

menu.createStream().pipe(process.stdout);

}

function salvaConfig() {
  siteconf.save(function (err) {
      if (err) {
        console.error(err.message);
        return;
      }
      console.log('operazione completata');
    });
}

function creautente (user) {
  var password = generatePassword(12,false);
    console.log('creo l\'utente'+ user +' su vesta con password' + password + '...');
    console.log ('/usr/local/vesta/bin/v-add-user ' + user + ' ' + password + ' ' + nconf.get('email'));
    //exec('/usr/local/vesta/bin/v-add-user ' + user + ' ' + password + ' ' +nconf.get('email'), puts);
    
    siteconf.set('vesta:username', user);
    siteconf.set('vesta:password', password);
    
} 

function creahosting(user, domain) {
    console.log('creazione hosting ' + domainname + ' con ip ' +nconf.get('ip') );
    console.log ('/usr/local/vesta/bin/v-add-web-domain ' + user + ' ' + domainname + ' ' + nconf.get('ip'));
    //exec('/usr/local/vesta/bin/v-add-web-domain ' + user + ' ' + domainname + ' ' +nconf.get('ip'), puts);
}

function creadb (user) {
 console.log('crea db');
 var password_db = generatePassword(12,false);
 console.log ('/usr/local/vesta/bin/v-add-database ' + user + ' DB U ' + password_db);
 //exec('/usr/local/vesta/bin/v-add-database ' + user + ' DB U ' + password, puts);
  siteconf.set('database:db', user+'_DB');
  siteconf.set('database:username', user+'_U');
    siteconf.set('database:password', password_db); 
}

function installwp (user,domain) {
	console.log('installa wp');
  var password_wp = generatePassword(12,false);
  dir='/home/'+user+'/web/'+domain+'/public_html';
  exec('cd '+dir);
  exec('usermod -a -G '+user+' admin');
  exec('chmod -R 777 '+dir);
  exec('sudo -u admin wp core download --locale=it_IT');
  exec('sudo -u admin wp core config --dbname='+user+'_DB --dbuser='+user'_U --dbpass='+password_wp+' --locale=it_IT');
  exec('sudo -u admin wp core install --url=www.'+domain+' --title='+domain' --admin_user='+nconf.get('wp_user')+' --admin_password='+password_wp+' --admin_email='+nconf.get('email');
  exec('sudo -u admin wp rewrite structure /%postname%/');
  exec('sudo -u admin wp plugin install wordpress-seo --activate');
  exec('rm /index.html');
  exec('chmod -R 755 '+dir);
  exec('chown -R '+user+' '+dir;

  siteconf.set('wordpress:username', nconf.get('wp_user'));
    siteconf.set('database:password', password_wp); 
    
}

function puts(error, stdout, stderr) { sys.puts(stdout) }