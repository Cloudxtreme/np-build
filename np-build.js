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
 var sys = require('util')
 var child_process = require('child_process');
 var child;
 var network = require('network');
 var myip = network.get_public_ip(function(err, ip) {
 });
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport();

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
  var email = nconf.get('email');
  var ip = nconf.get('ip');
  var hostname = nconf.get('hostname');
  var wp_user  = nconf.get('wp_user');
  console.log(hostname);
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
          creautente(username, email);
                creahosting(username, domainname,ip);
                creadb(username);
          salvaConfig();

            break;
            case '2':
          creautente(username,email);
    creahosting(username,domainname,ip);
          creadb(username);
          var passdb = siteconf.get('database:password');
          installwp(username,domainname,email,wp_user,passdb);
          salvaConfig();
            break;
            case '3':
          creautente(username,email);
          creahosting(username,domainname,ip);
          salvaConfig();

                break;
        }

  mailConfig(username,domainname,email);

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

function mailConfig(username,domain,email) {
    //console.log('cat '+username+'.json | mail -s \'[dati dominio] '+domain+' su '+os.hostname()+'\' ' +email);
  transporter.sendMail({
    from: 'root@'+os.hostname()+'',
    to: email,
    subject: '[dati dominio] '+domain+' su '+os.hostname()+'',
    text: '[dati dominio] '+domain+' su '+os.hostname()+'',
    attachments: [
        {   // utf-8 string as an attachment
              path: username+'.json'
        }]
  });
}


function creautente (user, email) {
  var password = generatePassword(12,false);
    console.log('creo l\'utente'+ user +' su vesta con password ' + password + '...');
    //console.log ('/usr/local/vesta/bin/v-add-user ' + user + ' ' + password + ' ' +email );
    execSync('/usr/local/vesta/bin/v-add-user ' + user + ' ' + password + ' ' +email, puts);
    siteconf.set('vesta:username', user);
    siteconf.set('vesta:password', password);
}

function creahosting(user,domain,ip) {
    console.log('creazione hosting ' + domainname + ' con ip ' + ip);
    //console.log ('/usr/local/vesta/bin/v-add-web-domain ' + user + ' ' + domainname + ' ' + ip);
    execSync('/usr/local/vesta/bin/v-add-web-domain ' + user + ' ' + domainname + ' ' +ip, puts);
}

function creadb (user) {
 console.log('crea db');
 var password_db = generatePassword(12,false);
 console.log ('/usr/local/vesta/bin/v-add-database ' + user + ' DB U ' + password_db);
 execSync('/usr/local/vesta/bin/v-add-database ' + user + ' DB U ' + password_db, puts);
  siteconf.set('database:db', user+'_DB');
  siteconf.set('database:username', user+'_U');
    siteconf.set('database:password', password_db);
}

function installwp (user,domain,email,wp_user,password_db) {

  console.log('installa wp');
  var password_wp = generatePassword(12,false);
  dir='/home/'+user+'/web/'+domain+'/public_html';
  //execSync('cd '+dir);
  execSync('usermod -a -G '+user+' admin');
  execSync('chmod -R 777 '+dir);
  console.log('scarico wordpress');
  execSync('sudo -u admin wp core download --locale=it_IT --path='+dir);
  console.log('scrivo un file di configurazione');
  //console.log('sudo -u admin wp core config --dbname='+user+'_DB --dbuser='+user+'_U --dbpass='+password_db+' --locale=it_IT')
  execSync('sudo -u admin wp core config --dbname='+user+'_DB --dbuser='+user+'_U --dbpass='+password_db+' --locale=it_IT --path='+dir);
  console.log('installo wordpress e creo le tabelle nel db');
  //console.log('sudo -u admin wp core install --url=www.'+domain+' --title='+domain+' --admin_user='+wp_user+' --admin_password='+password_wp+' --admin_email='+email+' --path='+dir);
  execSync('sudo -u admin wp core install --url=www.'+domain+' --title='+domain+' --admin_user='+wp_user+' --admin_password='+password_wp+' --admin_email='+email+' --path='+dir);
  console.log('imposto i permalink');
  execSync('sudo -u admin wp rewrite structure /%postname%/ --path='+dir);
  console.log('installo i plugin:');
  console.log('Wordpress-seo');
  execSync('sudo -u admin wp plugin install wordpress-seo --activate --path='+dir);
  execSync('rm '+dir+'/index.html');
  execSync('chmod -R 755 '+dir);
  execSync('chown -R '+user+' '+dir);

  siteconf.set('wordpress:username', wp_user);
    siteconf.set('wordpress:password', password_wp);

}

function execSync(command) {
// Run the command in a subshell
child_process.exec(command + ' 2>&1 1>/root/np-build/output && echo done! > /root/np-build/done');

// Block the event loop until the command has executed.
while (!fs.existsSync('/root/np-build/done')) {
// Do nothing
}

// Read the output
var output = fs.readFileSync('/root/np-build/output');

// Delete temporary files.
fs.unlinkSync('/root/np-build/output');
fs.unlinkSync('/root/np-build/done');

return output;
}

function puts(error,stdout,stderr){sys.puts(stdout); }