var http = require('http') ,
    https = require('https'),
    url = require('url'),
    path = require('path'),
    fs = require('fs'),
    port = process.env.PORT || 8888;
var sslOptions = {
  key: fs.readFileSync('./ssl-cert/server.key'),
  cert: fs.readFileSync('./ssl-cert/server.crt'),
  ca: fs.readFileSync('./ssl-cert/ca.crt'),
  requestCert: true,
  rejectUnauthorized: false
};

var listener = function (request, response){
  var Response = {
    '200':function(file, filename){
      var extname = path.extname(filename);
      var header = {
        'Access-Control-Allow-Origin':'*',
        'Pragma': 'no-cache',
        'Cache-Control' : 'no-cache'
      };

      if(filename.indexOf('.css')!=-1){
        header['Content-Type'] = 'text/css';
      }

      response.writeHead(200, header);
      response.write(file, 'binary');
      response.end();
    },
    '404':function(){
      response.writeHead(404, {'Content-Type': 'text/plain'});
      response.write('404 Not Found\n');
      response.end();
    },
    '500':function(err){
      response.writeHead(500, {'Content-Type': 'text/plain'});
      response.write(err + '\n');
      response.end();
    }
  };

  var uri = url.parse(request.url).pathname,
  filename = path.join(process.cwd(), '/public/' + uri);

  fs.exists(filename, function(exists){
    console.log(filename + ' ' + exists);
    if (!exists) { Response['404'](); return ; }
    if (fs.statSync(filename).isDirectory()) { filename += '/index.html'; }

    fs.readFile(filename, 'binary', function(err, file){
      if (err) { Response['500'](err); return ; }
      Response['200'](file, filename);
    }); 
  });
};

if(process.env.NODE_ENV === 'production'){
  http.createServer(listener).listen(parseInt(port, 10));
}
else{
  https.createServer(sslOptions, listener).listen(parseInt(port, 10));
}

console.log('Hosted on https://localhost:' + parseInt(port, 10) + '/');

