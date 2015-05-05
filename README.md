# node_dropbox
Assign1 - Nodejs dropbox project

This is a basic Dropbox clone to sync files across multiple remote folders.

Time spent: 15 hours

Features
Required

Client can make GET requests to get file or directory contents - Done
Client can make HEAD request to get just the GET headers - Done
Client can make PUT requests to create new directories and files with content - Done
Client can make POST requests to update the contents of a file - Done 
(Post request is jsut to add a new file/or a folder, for update use Put)

Client can make DELETE requests to delete files and folders - Done
Server will serve from --dir or cwd as root - Done
Client will sync from server over TCP to cwd or CLI dir argument - Done

None of the optional functionaliy done.
[ ] Client and User will be redirected from HTTP to HTTPS
[ ] Server will sync from client over TCP
[ ] Client will preserve a 'Conflict' file when pushed changes preceeding local edits
[ ] Client can stream and scrub video files (e.g., on iOS)
[ ] Client can download a directory as an archive
[ ] Client can create a directory with an archive
[ ] User can connect to the server using an FTP client

Additional Note:
1) client and server code are created under seperate directory, respectively. 
2) server_files and client_files are the files respository folders created outside of client and server folder.  By default, files in server are created in server_files and the  client files in the client_files folder. 
3) reason  server and client files folders are created outside of the working direcotry due to 'nodemon', which forces client and server node to restart on  file update.
4) Program is implemented with the command line feature to give any directory path.
5) Use POST to add a new file or a folder and use PUT to update the file


