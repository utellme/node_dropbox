let bluebird = require('bluebird')
let jot = require('json-over-tcp')
let path = require('path')
let fs = require('fs')
let mkdirp = require('mkdirp')
let rimraf = require('rimraf')
let args = require('yargs').argv

require('songbird')


const PORT = 9000
const HOST = '127.0.0.1'
const ROOT_DIR = args.dir ? path.resolve(args.dir) : path.resolve('/Users/dvalia/Documents/workspace-sts/nodejs/wk1/assign1-dropbox/client_files')


  // Start a connection to the server
  let socket = jot.connect(PORT, HOST, function(){
    // Send the initial message once connected
    socket.write({connetion: "connection request"});
  });
  
  // Whenever the server sends us an object...
  socket.on('data', function(data){


    if(data.connection)
      console.log("Server's msg: " + data.connection);

    if(data.action){

      //console.log("action: " + data.action + " path: " + data.path + " type: " + data.type + " contents: " + data.contents + " updated: " + data.updated)

      console.log("Data: " + JSON.stringify(data))
  
      if(data.action === 'create')
        CreateObject(data)
      else if(data.action === 'update')
        UpdateObject(data)
      else if (data.action === 'delete')
        DeleteObject(data)
      else
        console.log ('Invalid action')
    }

  });




  socket.on('close', function() {
    console.log('Connection closed Trying again....')
    socket = jot.connect(PORT, HOST, function(){
      console.log('CONNECTED TO: ' + HOST + ':' + PORT);
    })

  })

  socket.on('error', function(e) {
    if(e.code === 'ECONNREFUSED') {
        console.log('Is the server running at ' + PORT + '?');

        socket.setTimeout(4000, function() {
          socket = jot.connect(PORT, HOST, function(){
                console.log('CONNECTED TO: ' + HOST + ':' + PORT);
                
            });
        });

        console.log('Trying at port:' + PORT + ' again');

    }   
});

function CreateObject(data){

  let filepath =  path.resolve(path.join(ROOT_DIR, data.path))
  console.log ("filepath: " + filepath)

  if(filepath.indexOf(ROOT_DIR) !== 0){
    console.log ("Invalid filepath: " + filepath)
    return
  }

  let dirpath = data.type === 'dir' ? filepath : path.dirname(filepath)
  dirpath = path.resolve(dirpath)

  console.log ("dirpath: " + dirpath)


  async()=>{

    await mkdirp.promise(dirpath)

    if(data.type=== 'dir')
      return


    await fs.promise.writeFile(filepath, data.contents)

  }().catch(()=>console.log("****Error****"))

}

function UpdateObject(data){
let filepath =  path.resolve(path.join(ROOT_DIR, data.path))
console.log ("filepath: " + filepath)

 let dirpath = data.type === 'dir' ? filepath : path.dirname(filepath)
  dirpath = path.resolve(dirpath)

console.log ("dirpath: " + dirpath)

  async()=>{

    await mkdirp.promise(dirpath)

    if(data.type=== 'dir')
      return

    await fs.promise.truncate(filepath, 0)

    await fs.promise.writeFile(filepath, data.contents)
  }()

}

function DeleteObject(data){

let filepath =  path.resolve(path.join(ROOT_DIR, data.path))
console.log ("filepath: " + filepath)

let dirpath = data.type === 'dir' ? filepath : path.dirname(filepath)
  dirpath = path.resolve(dirpath)
  console.log ("dirpath: " + dirpath)

  async()=>{

    if(data.type === 'dir')
      await rimraf.promise(dirpath)
    else
      await fs.promise.unlink(filepath)
    
  }()

}



//}