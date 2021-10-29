// https://vk.com/zfriks

class Replies {
     constructor() {
          this.replies = { items: [] }
          this.stats = { items: [] }
          this.dialogInputText = ''
          this.text = ''
          this.dialogOpen = 0
          this.canAddReply = 0
          this.repliesToComplete = 0
          this.db = null
     }
     loadReplies() {
          const request = window.indexedDB.open('repliesDB', 2);
          let repliesToComplete = window.localStorage.getItem('repliesToComplete');

          if (repliesToComplete == null) {
               window.localStorage.setItem('repliesToComplete', 0);
               repliesToComplete = 0;
          };

          request.onsuccess = (event) => {
               this.repliesToComplete = +repliesToComplete;
               this.db = event.target.result;

               let data = this.db.transaction('replies', 'readwrite').objectStore('replies');

               data.getAll().onsuccess = (data) => {
                    this.replies.items = data.target.result;
                    this.isNewDay();
               };
          }

          request.onupgradeneeded = (event) => {

               this.db = event.target.result;
               var objectStore = this.db.createObjectStore("replies", { keyPath: 'id' });

               objectStore.add({ id: 0, date: new Date().toJSON().split(/T/)[0], replies: 0 });

               this.replies.items = [{ id: 0, date: new Date().toJSON().split(/T/)[0], replies: 0 }];
          }
          return
     }
     showReplies() {
          this.dialogOpen = 2;

          if (this.repliesToComplete == 0) {
               this.setRepliesToComplete('new-replies');
               return;
          };

          let progress, index, startIndex, result = [];

          startIndex = this.replies.items.length - 1;

          this.replies.items.forEach((item, i) => {
               index = startIndex - i;

               progress = Math.round((this.replies.items[index].replies / this.repliesToComplete) * 100);

               if (this.replies.items[index].replies >= this.repliesToComplete) {
                    progress = 100;
                    result.push(`<n>{3AA2D3}${this.replies.items[index].date}\t\t    {${this.progressInColor(progress, 81, 46)}}${this.replies.items[index].replies} / ${this.repliesToComplete} ✅`); // если норма выполнена то ставиться галочка
               } else {
                    result.push(`<n>{3AA2D3}${this.replies.items[index].date}\t\t    {${this.progressInColor(progress, 81, 46)}}${this.replies.items[index].replies} / ${this.repliesToComplete}`);
               }
          });

          App.$children[0].addDialogInQueue("[0,0,\"Ответы за 20 дней\",\"\",\"Сброс\",\"Закрыть\",0,0]", "Дата\t\t\t    Ответы / Норма<n><n>{FFFFFF}" + result.join(''), 0);
          return;
     }
     addReply() {
          let lastIndex = this.replies.items.length - 1;
          this.replies.items[lastIndex].replies++;

          if (this.replies.items[lastIndex].replies == this.repliesToComplete) {
               this.sendGameText(`[2,\"~y~Поздравляю!~n~~b~Норма успешно выполнена!\",3000,0]`);
               return;
          };

          this.sendGameText(`[2,\"~b~+1 ответ\",1000,0]`);
          return;
     }
     saveReplies() {
          let data = this.db.transaction('replies', 'readwrite').objectStore('replies');
          let lastIndex = this.replies.items.length - 1;

          data.put(this.replies.items[lastIndex]);
          return
     }
     sendGameText(text) {
          if (window.App.$children[0].components.GameText.open.status) {
               window.App.$children[0].$refs["GameText"][0].add(text);
               return;
          };

          window.App.$children[0].components.GameText.open.status = 1;

          setTimeout(() => {
               window.App.$children[0].$refs["GameText"][0].add(text);
          }, 40);
          return;
     }
     progressInColor(h, s, l) {
          l /= 100;
          const a = s * Math.min(l, 1 - l) / 100;
          const f = n => {
               const k = (n + h / 30) % 12;
               const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
               return Math.round(255 * color).toString(16).padStart(2, '0').toUpperCase()   // convert to Hex and prefix "0" if needed
          };
          return `${f(0)}${f(8)}${f(4)}`;
     }
     setRepliesToComplete(value) {
          this.dialogOpen = 1;

          value = value + '';

          if (value == 'new-replies') {
               App.$children[0].addDialogInQueue("[0,1,\"{FFCD00}Норма\",\"\",\"Далее\",\"\",0,0]", "Введите норму по зеткам.<n><n>По достижению выполнения нормы Вы будете уведомлены,<n>поэтому не стоит ставить огромные числа.", 0);
               return;
          };

          if (!Number.isInteger(+value) || value.startsWith(0) || +value <= 0) {
               App.$children[0].addDialogInQueue("[0,1,\"Норма\",\"\",\"\",\"Далее\",0,0]", "{D56F33}В поле должны быть цифры и норма не может быть нулевой!", 0);
               return;
          };

          this.repliesToComplete = +value;

          window.localStorage.setItem('repliesToComplete', +value);
          this.showReplies();
          return
     }
     isNewDay() {

          let lastIndex = this.replies.items.length - 1,
               todayDate = new Date().toJSON().split(/T/)[0],
               id = this.replies.items[lastIndex].id;

          if (!this.replies.items.length || this.replies.items[lastIndex].date != todayDate) {
               this.replies.items.push({
                    id: ++id,
                    replies: 0,
                    date: todayDate
               });
               this.saveReplies();
          };

          if (this.replies.items.length > 20) {
               let finishIndex = this.replies.items.length - 20;

               for (let i = 0; i < finishIndex; i++) {
                    this.replies.items.shift();
               };
          };

          return;
     }
     isAdmin() {
          return App.$children[0].$refs["Report"][0].chat.name.split(/[\[-\]]/g).length == 7 || App.$children[0].$refs["Report"][0].appeals[0].isAdmin;
     }
     validateText() {
          let inputHandle = document.querySelector('.report-chat__input').children[0];


          if (inputHandle.oninput == null) {

               inputHandle.oninput = (data) => {
                    this.text = data.target.value;

                    if (data.target.value.match(/[\\"']/) != null || data.target.value.trim() == '') {
                         this.canAddReply = 0;
                    };

                    if (data.target.value.match(/[\\"']/) == null && data.target.value.trim() != '') {
                         this.canAddReply = 1;
                    };

               };
          }
     }
     closeReplies(){
          App.$children[0].$children[1].$children[0].back();
     }
     closeFaq(){
          this.canAddReply = 0
     }
     start() {
          this.loadReplies();

          window.App.$children[0].components["Report"].open = new Proxy(window.App.$children[0].components["Report"].open, {
               set(target, prop, value){
                    target[prop] = value;

                    !value? replies.closeFaq(): null;
                    
                    return true
               }
          })

          document.addEventListener('keydown', (e) => {

               try {

                    if ((e.keyCode == 27 || e.keyCode == 13) && this.dialogOpen){
                         this.closeReplies();
                    }

                    if (getInterfaceStatus('Report')) {

                         if (e.target.tagName == 'INPUT' && e.target.placeholder == 'Введите сообщение...' && this.isAdmin()) {
                              this.validateText();
                         };

                         if (this.canAddReply && e.keyCode == 13 && e.target.placeholder != 'Введите вопрос...') {
                              this.canAddReply = 0;
                              this.text = '';
                              this.addReply();
                              this.saveReplies();
                         };
                    };

               } catch (e) { };

          });

          document.addEventListener('keyup', (e) => {

               if (this.dialogOpen == 1 && e.keyCode != 13 && e.target.placeholder == 'Введите значение') { // считывание кол-ва нормы, введенное пользователем
                    this.norma = e.target.value;
               }

               if (e.keyCode == 80 && e.target.tagName === "BODY" && this.replies && !window.IsDialogOpened()) { // открытие диалога со сделанными ответами на P (англ)
                    this.showReplies();
               }

               if (e.keyCode == 13 && (e.target.tagName === "INPUT" || e.target.tagName === "BODY") && this.dialogOpen == 1 && this.norma) { // на Enter установка нормы по ответам
                    this.setRepliesToComplete(this.norma);
                    return
               }

               if (e.keyCode == 13 && e.target.tagName === "BODY" && this.dialogOpen == 2) {
                    this.setRepliesToComplete('new-replies');
               }

               if (e.keyCode == 27 && this.dialogOpen) {
                    this.dialogOpen = 0;
               }
          })

          document.addEventListener('mousedown', (e) => {
               if (this.dialogOpen && e.target.classList[0] == 'window-button' && e.target.innerText == 'Закрыть'){
                    App.$children[0].$children[1].$children[0].back();
               }

               if (e.target.classList[0] == 'window-button' && e.target.innerText == 'Сброс' && this.dialogOpen == 2) {
                    App.$children[0].$children[1].$children[0].back();
                    setTimeout(() => {
                         this.setRepliesToComplete('new-replies');
                    }, 100);
               };

               if (e.target.classList[0] == 'window-button' && e.target.innerText == 'Далее' && this.dialogOpen == 1) {
                    App.$children[0].$children[1].$children[0].back();
                    setTimeout(() => {
                         this.setRepliesToComplete(this.norma);
                    }, 100);
               };
          })

          document.addEventListener('click', (e) => {

               if (e.target.readOnly) {
                    e.target.className = '';
                    e.target.readOnly = '';
               }

               if (this.canAddReply && ((e.path[0].classList[0] === 'button' && e.target.tagName === 'DIV') || (e.path[1].classList[0] === 'button' && e.target.tagName === 'IMG'))) { // засчитывание ответа на нажатие МЫШКОЙ
                    this.canAddReply = 0;
                    this.addReply();
                    this.saveReplies();
               };

               if (e.target.classList[0] == 'window-button' && e.target.innerText == 'Сброс' && this.dialogOpen == 2) {
                    this.setRepliesToComplete('new-replies');
               };

               if (e.target.classList[0] == 'window-button' && e.target.innerText == 'Закрыть') {
                    this.dialogOpen = 0;
               };
          })
     }
}

const replies = new Replies();

replies.start();