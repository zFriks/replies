const ws = require('ws'),
     fs = require('fs'),
     path = require('path')

const server = new ws.Server({ port: 2000 });

function getListOfScripts() {
     try {
          let path_to_folder = './cef\\assets\\mods'
          let files_to_load = []

          if (fs.existsSync(path_to_folder)) {

               fs.readdirSync(path_to_folder).forEach((item) => {
                    if (item.endsWith('.js')) files_to_load.push(item)
               })

               return files_to_load
          }

          fs.mkdirSync(path_to_folder);

          return files_to_load
     } catch (error) {
          console.log(error);
     }
}

function connectScriptsToHtml() {
     try {
          let html_path = './cef\\assets\\index.html'
          let html = fs.readFileSync(html_path).toString().split('</body>');

          getListOfScripts().forEach(item => {
               if (html[0].search(item) == -1) {
                    html[0] = html[0] + `<script src="mods/${item}"></script>`
                    console.log('Добавлен скрипт ->', item);
               }
          })

          html[0] = html[0] + '</body>'
          html = html.join('')

          fs.writeFileSync(html_path, html);
     } catch (error) {
          console.log(error);
     }


     return
}

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

connectScriptsToHtml();
console.log('ws started...');