const ws = require('ws'),
     fs = require('fs');

const server = new ws.Server({ port: 2000 });

function saveReplies(data) {
     let path_to_replies = process.env.APPDATA + "\\replies.json";

     fs.writeFileSync(path_to_replies, JSON.stringify(data));

     console.log('Replies was saved!');
}

function loadAndSendReplies() {
     let path_to_replies = process.env.APPDATA + "\\replies.json";

     if (!fs.existsSync(path_to_replies)) {
          let data = {
               repliesToComplete: 0,
               items: [
                    {
                         date: new Date().toJSON().split('T')[0],
                         replies: 0
                    }
               ]
          }

          fs.writeFileSync(path_to_replies, JSON.stringify(data));

          console.log('File was created!');
     }

     return fs.readFileSync(path_to_replies, { encoding: 'utf-8' })
}

server.on('connection', ws => {
     console.log('User connected...');

     ws.on('message', msg => {
          try {
               
               msg = JSON.parse(msg.toString());

               console.log('msg --> ', msg);

               if (msg[1] == 'load-replies') {
                    ws.send(loadAndSendReplies());
                    return
               }

               if (msg[1] == 'save-replies') {
                    ws.send('replies-saved');
                    console.log(msg[0]);

                    saveReplies(msg[0]);
                    return
               }

          } catch (error) {
               console.log(error);
          }

     });
});

console.log('ws started...');