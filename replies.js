// https://vk.com/zfriks
const Replies = {
     data: {
          config: {},
          defaultConfig: {
               items: [],
               settings: {
                    showPlusOneReply: true,
                    repliesToComplete: 0,
                    indicator: {
                         enabled: false,
                         coors: {
                              x: '91vw',
                              y: '32vh'
                         }
                    }
               }
          }
     },
     indicator: {
          data: {
               el: null,
               valueEl: null,
          },
          create() {
               this.data.el = document.createElement('div');
               this.data.el.innerHTML = `<div class="replies-counter__text">Ответы/Норма</div><div class="replies-counter__value">0/0</div>`;
               this.data.el.className = 'replies-counter';
               this.data.el.style.display = 'none';

               this.data.el.style.top = Replies.data.config.settings.indicator.coors.y;
               this.data.el.style.left = Replies.data.config.settings.indicator.coors.x;

               this.data.valueEl = this.data.el.querySelector('.replies-counter__value');

               document.body.append(this.data.el);

               jsLoader.log.makeLog('Replies', `[create] Indicator was created`);
          },
          show() {
               this.refreshIndicator();

               this.data.el.style.display = '';
          },
          hide() {
               this.data.el.style.display = 'none';
          },
          setDragable() {
               this.data.el.onmousedown = function (event) {

                    const shiftX = event.clientX - Replies.indicator.data.el.getBoundingClientRect().left;
                    const shiftY = event.clientY - Replies.indicator.data.el.getBoundingClientRect().top;

                    moveAt(event.pageX, event.pageY);

                    function moveAt(pageX, pageY) {
                         Replies.indicator.data.el.style.left = pageX - shiftX + 'px';
                         Replies.indicator.data.el.style.top = pageY - shiftY + 'px';
                    }

                    function onMouseMove(event) {
                         moveAt(event.pageX, event.pageY);
                    }

                    document.addEventListener('mousemove', onMouseMove);

                    Replies.indicator.data.el.onmouseup = function () {
                         document.removeEventListener('mousemove', onMouseMove);
                         Replies.data.config.settings.indicator.coors.x = Replies.indicator.data.el.style.left;
                         Replies.data.config.settings.indicator.coors.y = Replies.indicator.data.el.style.top;
                         Replies.indicator.data.el.onmouseup = null;

                         Replies.saveData();
                    };

               };

               this.data.el.ondragstart = function () {
                    return false;
               };
          },
          refreshIndicator() {
               if (Replies.data.config.items.length === 0) return;

               const lastIndex = Replies.data.config.items.length - 1;

               this.data.valueEl.innerText = `${Replies.data.config.items[lastIndex].replies}/${Replies.data.config.settings.repliesToComplete}`;

               jsLoader.log.makeLog('Replies', `[indicator refresh] Indicator value was refreshed: ${this.data.valueEl.innerText}`);
          },
          setOpenCloseHook() {
               App.$children[0].$children[2].info = new Proxy(App.$children[0].$children[2].info, {
                    set(target, props, value) {
                         if (props == 'show' && value === true && Replies.data.config.settings.indicator.enabled) {
                              Replies.indicator.show();
                         }

                         if (props == 'show' && value === false && Replies.data.config.settings.indicator.enabled) {
                              Replies.indicator.hide();
                         }

                         return Reflect.set(target, props, value);
                    }
               });

               jsLoader.log.makeLog('Replies', `[create] Indicator hooks set`);
          },
          init() {
               this.create();
               this.setDragable();
               this.setOpenCloseHook();
          }
     },
     loadData() {
          jsLoader.log.makeLog('Replies', 'Loading replies from json file');

          return new Promise((resolve) => {
               jsLoader.socket.sendEvent('readFile|cef/assets/replies.json', e => {
                    const [type, data] = e.data.split('|');

                    if (type == 'readFile') {
                         if (data.length === 0) {
                              jsLoader.log.makeLog('Replies', 'Json file dont exist, creating new');

                              this.data.config = this.data.defaultConfig;

                              this.saveData();

                              resolve();
                              return
                         }

                         try {
                              this.data.config = JSON.parse(data);

                              jsLoader.log.makeLog('Replies', 'Replies was loaded successfuly');
                         } catch (error) {
                              jsLoader.log.makeLog('Replies', 'Error in loading replies from file, loading default config');

                              this.data.config = this.data.defaultConfig;

                              this.saveData();
                         }
                         finally {
                              resolve();
                         }
                    }
               });
          });
     },
     saveData() {
          const configToSave = JSON.stringify(this.data.config, null, ' ');

          jsLoader.socket.sendEvent(`writeFile|cef/assets/replies.json|${configToSave}`, e => { });

          jsLoader.log.makeLog('Replies', `[save data] Saved replies to file`);

          this.indicator.refreshIndicator();
     },
     reverseArray(arr) {
          const newArr = [];

          arr.forEach((item) => {
               newArr.unshift(item);
          });

          return newArr;
     },
     showMainDialog() {
          if (this.data.config.settings.repliesToComplete === 0) {
               this.showSetRepliesToCompleteDialog(false, true);
               return;
          }

          let dialogText = '';

          this.reverseArray(this.data.config.items).forEach((item, index) => {
               dialogText += `<n>{6aa5ff}${item.date}{FFFFFF}<t>{${this.progressInColor(item.replies / this.data.config.settings.repliesToComplete * 100)}}${item.replies}/${this.data.config.settings.repliesToComplete}{FFFFFF}${this.data.config.settings.repliesToComplete <= item.replies ? ' ✅' : ''}`;
          });

          jsLoader.utils.createDialog(0, 'Ответы за 20 дней', '', 'Параметры', 'Закрыть', `Дата<t>Ответы/Норма<n>${dialogText}`, (e) => {
               setTimeout(() => this.showSettingsDialog(), 200);
          });
     },
     showSettingsDialog() {
          const onePlusReplyOption = `1. ${this.data.config.settings.showPlusOneReply ? `{008900}Показывать{FFFFFF}` : '{e20000}Не показывать{FFFFFF}'} "+1 Ответ"`;
          const indicator = `2. ${this.data.config.settings.indicator.enabled ? `{008900}Показывать{FFFFFF}` : '{e20000}Не показывать{FFFFFF}'} Индикатор кол-ва зеток`;
          const repliesToCompleteOption = `3. Норма зеток: {34b0c5}${this.data.config.settings.repliesToComplete}{FFFFFF} {8b8b8b}(Нажмите, чтобы настроить){FFFFFF}`;

          jsLoader.utils.createDialog(2, 'Настройки зеток', '', 'Выбрать', 'Выйти', `${onePlusReplyOption}<n>${indicator}<n>${repliesToCompleteOption}`, (e) => {
               if (e.includes('1.')) {
                    this.data.config.settings.showPlusOneReply = !this.data.config.settings.showPlusOneReply;
                    this.saveData();

                    setTimeout(() => this.showSettingsDialog(), 50);
                    return;
               }

               if (e.includes('2.')) {
                    Replies.data.config.settings.indicator.enabled = !Replies.data.config.settings.indicator.enabled;

                    if (Replies.data.config.settings.indicator.enabled) {
                         this.indicator.data.el.style.left = this.data.config.settings.indicator.coors.x = this.data.defaultConfig.settings.indicator.coors.x;
                         this.indicator.data.el.style.top = this.data.config.settings.indicator.coors.y = this.data.defaultConfig.settings.indicator.coors.y;

                         Replies.indicator.show();
                    } else {
                         Replies.indicator.hide();
                    }

                    this.saveData();
                    setTimeout(() => this.showSettingsDialog(), 50);
                    return;
               }

               if (e.includes('3.')) {
                    setTimeout(() => this.showSetRepliesToCompleteDialog(), 50);

                    return;
               }
          });
     },
     showSetRepliesToCompleteDialog(isNumIncorrect = false, isFirstOpen = false) {
          const dialogText = isNumIncorrect ? '{db0000}Вы ввели неккоретное число!' : 'Введите нужное кол-во зеток, на которые необходимо ответить';

          jsLoader.utils.createDialog(1, 'Установка нормы', '', 'Установить', 'Назад', dialogText, (value) => {
               const repliesToComplete = +value;

               if (Number.isNaN(repliesToComplete) || repliesToComplete < 0 || repliesToComplete > 999 || value.trim().length === 0) {
                    if (isFirstOpen) {
                         setTimeout(() => this.showSetRepliesToCompleteDialog(true, true), 100);
                         return
                    }

                    setTimeout(() => this.showSetRepliesToCompleteDialog(true), 100);
                    return
               }


               this.data.config.settings.repliesToComplete = repliesToComplete;
               this.saveData();

               if (isFirstOpen) {
                    setTimeout(() => this.showMainDialog(), 100);
                    return
               }

               setTimeout(() => this.showSettingsDialog(), 100);

               jsLoader.log.makeLog('Replies', `[replies to complete] Set replies to complete: ${repliesToComplete}`);
          }, () => {
               if (isFirstOpen) {
                    return
               }

               setTimeout(() => this.showSettingsDialog(), 100);
          });
     },
     isNewDay() {
          try {
               const lastIndex = this.data.config.items.length - 1,
                    todayDate = new Date().toLocaleDateString();

               jsLoader.log.makeLog('Replies', `[is new day] Checking is today is new day`);

               if (this.data.config.items.length === 0 || this.data.config.items[lastIndex].date != todayDate) {
                    jsLoader.log.makeLog('Replies', `[is new day] New day`);

                    this.data.config.items.push({
                         replies: 0,
                         date: todayDate
                    });

                    this.saveData();
               };

               if (this.data.config.items.length > 20) {
                    jsLoader.log.makeLog('Replies', `[is new day] More than 20 entries have been noticed`);

                    while (this.data.config.items.length > 20) {
                         this.data.config.items.shift();
                    }

                    this.saveData();
               };
          } catch (error) {
               jsLoader.log.makeLog('Replies', 'Error in loading replies from file, loading default config');

               this.data.config = this.data.defaultConfig;

               this.saveData();
          }
          
          this.indicator.refreshIndicator();
          return;
     },
     progressInColor(h, s = 81, l = 46) {
          if (h > 100) h = 100;

          l /= 100;
          const a = s * Math.min(l, 1 - l) / 100;
          const f = n => {
               const k = (n + h / 30) % 12;
               const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
               return Math.round(255 * color).toString(16).padStart(2, '0').toUpperCase()   // convert to Hex and prefix "0" if needed
          };
          return `${f(0)}${f(8)}${f(4)}`;
     },
     isAdmin() {
          return (App.$children[0].$refs["Report"][0].chat.name.split(/[\[-\]]/g).length == 7 || App.$children[0].$refs["Report"][0].appeals[0].isAdmin);
     },
     addReply() {
          if (!this.isAdmin()) return;

          const lastIndex = this.data.config.items.length - 1;

          this.data.config.items[lastIndex].replies += 1;

          if (this.data.config.items[lastIndex].replies == this.data.config.settings.repliesToComplete) {
               jsLoader.utils.createGameText(2, '~y~Поздравляю!~n~~b~Норма успешно выполнена!', 2500);

               this.saveData();
               return;
          };

          if (this.data.config.settings.showPlusOneReply) jsLoader.utils.createGameText(2, '~b~+1 ответ', 1000);

          this.saveData();
          jsLoader.log.makeLog('Replies', `[add reply] added +1 reply`);
     },
     listenKeyUp() {
          document.body.addEventListener('keyup', (e) => {
               if (e.keyCode === 80 && e.target.tagName === "BODY" && !window.IsDialogOpened() && interface('Hud').server !== -1) {
                    this.showMainDialog();
               }
          });
     },
     setProxy() {
          window.sendClientEvent = new Proxy(window.sendClientEvent, {
               apply(target, thisArgs, args) {
                    if (args[1] === 'OnSendChatMessageTicket' && args[2].match(/[\\"']/) == null && args[2].trim() != '') {
                         Replies.addReply();
                    }
                    return Reflect.apply(target, thisArgs, args);
               }
          })
     },
     setStyles() {
          const style = document.createElement('style');
          style.innerHTML = '.replies-counter{position:absolute;background:linear-gradient(212.28deg,hsl(231deg 58% 13% / 96%) -33.33%,hsl(359deg 63% 30% / 96%) 143.46%);padding:.8vh;border-radius:.4vh;display:flex;flex-direction:column;align-items:center;color:hsl(0deg 0% 100%);gap:.5vh;cursor:auto;z-index:9999999999}.replies-counter__text{font-size:1.1vh;color:hsl(0deg 0% 100% / 45%);letter-spacing:.1em}.replies-counter__value{font-weight:400;font-size:1.3vh}';

          document.head.append(style);
     },
     init() {
          jsLoader.log.makeLog('Replies', `[init] Inited`);
          jsLoader.showAddedScript('Счетчик /z', 'info');

          this.listenKeyUp();

          this.setProxy();

          this.setStyles();

          this.loadData().then(() => {
               this.indicator.init();
               this.isNewDay();
          });
     }
}

Replies.init();