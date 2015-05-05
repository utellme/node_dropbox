let fs = require('fs')
let path = require('path')
let express = require ('express')
let morgan = require ('morgan')
let nodeify = require('bluebird-nodeify')
let mime = require('mime-types')
let rimraf = require('rimraf')
let mkdirp = require('mkdirp')
let bluebird = require('bluebird')
let jot = require('json-over-tcp')
let eventemitter = require('events').EventEmitter
let moment = require('moment')
let bodyParser = require('body-parser')
let args = require('yargs').argv

require('songbird')



const NODE_ENV = process.env.NODE_ENV
const PORT = process.env.port || 8000
//const ROOT_DIR = path.resolve('process.cwd())
const ROOT_DIR = args.dir ? path.resolve(args.dir) : path.resolve('/Users/dvalia/Documents/workspace-sts/nodejs/wk1/assign1-dropbox/server_files')

const TCP_PORT = 9000

console.log ("**** ROOT DIR " + ROOT_DIR)

let ee = new eventemitter()

let app = express()
let tcpsocket

//if(NODE_ENV === 'development'){

	app.use(morgan('dev'))
//}

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({
    extended: true
})) // for parsing application/x-www-form-urlencoded

//tcp connection

let tcpserver = jot.createServer(TCP_PORT)
//tcpserver.on('listening', createConnection)
tcpserver.on('connection', newConnectionHandler)

// Triggered when something connects to the server
function newConnectionHandler(socket){
  // Whenever a connection sends us an object...
  console.log("Client's msg: connection request")

  tcpsocket = this.socket

  socket.write({connection:"connected"})


  socket.on('end', function(){
  	console.log('client disconnected')
  })

  socket.on('data', function(data){
  
   // console.log("Client's message: " + data.connection);
  });

  ee.on('delete', function(data) {
  	socket.write(data)

  })

  ee.on('post', function(data) {
  	socket.write(data)

  })

  ee.on('put', function(data) {
  	socket.write(data)
  })

};


// Start listening
tcpserver.listen(TCP_PORT, ()=>{
	console.log('Listening @ tcp://127.0.0.1:' + TCP_PORT)
});

//http connection

app.listen(PORT, ()=> console.log('Listening @ http://127.0.0.1:' + PORT))

app.get('*', setFileMeta, sendHeaders, (req, res)=>{

	if(res.body) { 
		res.json(res.body)
		return	
	}

	fs.createReadStream(req.filepath).pipe(res)
	
})
	
app.head('*', setFileMeta, sendHeaders, (req, res) => res.end())


/*
 DELETE request - To DELETE an existing file or a folder
*/

app.delete('*', setFileMeta, (req, res, next) => {

	async() => {

		if(!req.stat) return res.send(400, 'Invalid Path')
		if(req.stat.isDirectory()){
			await rimraf.promise(req.filepath)
		}
		else{
			console.log(req.filepath)
			await fs.promise.unlink(req.filepath)
		}
		

		ee.emit('delete', {
			"action": "delete",                        // "update" or "delete"
		    "path": req.url,
		    "type": req.stat.isDirectory() ? 'dir': 'file',                            // or "file"
		    "contents": null,                            // or the base64 encoded file contents
		    "updated": moment.utc() 
		})

		res.end()

	}().catch(next)

})

/*
 POST request - To ADD a new file or a folder
*/
app.post('*', setFileMeta, setDirDetails,(req,res, next) => {

	let body = Object.keys(req.body)[0]
	async() =>{
		
		if(req.stat) return res.send(405, 'File exists')
		await mkdirp.promise(req.dirPath)

		if(!req.isDir) {
			//req.pipe(fs.createWriteStream(req.filepath))
			await fs.promise.writeFile(req.filepath, body)
		}
		res.end()
		
		ee.emit('post', {
			"action": "create",                        // "update" or "delete"
		    "path": req.url,
		    "type": req.isDir ? 'dir': 'file',       // or "file"
		    "contents": req.isDir ? null : body,      // or the base64 encoded file contents
		    "updated": moment.utc() 
		})

		  

	}().catch(next)


})

/*
 PUT request - To UPDATE an existing file or a folder
*/

app.put('*', setFileMeta, setDirDetails,(req,res, next) => {

	let body = Object.keys(req.body)[0]

	console.log("Body " + body);

	async() =>{

		console.log ("****req url:**** " + req.url + " req filepath: " + req.filepath)
		if(!req.stat) return res.send(405, 'File does not exists')
		if(req.isDir) return res.send(405, 'Path is a directory')

		await fs.promise.truncate(req.filepath, 0)

		//req.pipe(fs.createWriteStream(req.filepath))
		await fs.promise.writeFile(req.filepath, body)


		console.log ("****req url: " + req.url + " req filepath: " + req.filepath)


		ee.emit('put', {
			"action": "update",                        // "update" or "delete"
		    "path": req.url,
		    "type": req.isDir ? 'dir': 'file',       // or "file"
		    "contents": req.isDir ? null : body,      // or the base64 encoded file contents
		    "updated": moment.utc() 
		})

		res.end()

	}().catch(next)


})

function setDirDetails(req, res, next) {

	

	let filepath = req.filepath
	let endsWithSlash = filepath.charAt(filepath.length-1) === path.sep
	let hasExt = path.extname(filepath) !==''
	req.isDir = endsWithSlash || !hasExt
	req.dirPath = req.isDir ? filepath:path.dirname(filepath)
	next()

}

function setFileMeta(req, res, next) {
	 req.filepath = path.resolve(path.join(ROOT_DIR, req.url))
	 
	if(req.filepath.indexOf(ROOT_DIR) !== 0){
		res.send(400, 'Invalid path')
		return
	}

	fs.promise.stat(req.filepath)
	.then(stat => req.stat = stat, ()=> req.stat = null)
	.nodeify(next)
}

function sendHeaders(req, res, next) {

	nodeify (async () => {

		if(req.stat.isDirectory()){

			let files = await fs.promise.readdir(req.filepath)
			res.body = JSON.stringify(files)
			res.setHeader('Content-Length', res.body.length)
			res.setHeader('Content-Type', 'application/json')
			return
		}

		res.setHeader('Content-Length', stat.size)
		let contentType = mime.contentType(path.extname(req.filepath))
		res.setHeader('Content-Type', contentType)

		

	}(),(next))
}
	

