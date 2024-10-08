(function() {
    'use strict';
    if (!document.querySelector("#ytls-pane")) {
        var pane = document.createElement("div");
        var exit = document.createElement("span");
        var list = document.createElement("ul");
        var nowli = document.createElement("li");
        var nowa = document.createElement("a");
        var nowid;
        var nowtext = document.createElement("input");
        var box = document.createElement("textarea");
        var buttons = document.createElement("div");
        var paster = document.createElement("button");
        var adder = document.createElement("button");
        var copier = document.createElement("button");
        var offset = 5;
        var copyMode = 0;

        const storedOffset = localStorage.getItem('offset');
        offset = storedOffset !== null ? parseInt(storedOffset) : 5;
        
        browser.runtime.onMessage.addListener((message) => {
            if (message.type === 'SET_OFFSET') {
                offset = message.offset;
                localStorage.setItem('offset', offset);
            }
        });

        function closePane() {
            if (confirm("Close timestamp tool?")) {
                pane.remove();
                cancelAnimationFrame(nowid);
                window.removeEventListener("beforeunload", warn)
            }
        }

        function updateStamp(stamp, time) {
            stamp.innerHTML = formatTime(time);
            stamp.dataset.time = time;
            stamp.href = "https://youtu.be/" + location.search.split(/.+v=|&/)[1] + "?t=" + time
        }

        function clickStamp(e) {
            if (e.target.dataset.time) {
                e.preventDefault();
                document.querySelector("video").currentTime = e.target.dataset.time
            } else if (e.target.classList.contains("remove-timestamp")) {
                e.preventDefault();
                var li = e.target.parentElement;
                li.remove();
            } else if (e.target.dataset.increment) {
                e.preventDefault();
                var li = e.target.parentElement;
                var a = li.children[3];
                var time = parseInt(a.dataset.time) + parseInt(e.target.dataset.increment);
                updateStamp(a, time)
            }
        }

        function watchTime() {
            try {
                var time = Math.floor(document.querySelector("video").duration);
                updateStamp(nowa, time)
            } catch (e) {}
            nowid = requestAnimationFrame(watchTime)
        }

        function unformatTime(stamp) {
            var hms = stamp.split(":").map(e => parseInt(e));
            if (hms.length < 3) {
                return 60 * hms[0] + hms[1]
            }
            return 3600 * hms[0] + 60 * hms[1] + hms[2]
        }

        function newLi(time) {
            var li = document.createElement("li");
            var minus = document.createElement("span");
            var plus = document.createElement("span");
            var a = document.createElement("a");
            var text = document.createElement("input");
            var removeButton = document.createElement("span");
            removeButton.innerHTML = "❌";
            removeButton.classList.add("remove-timestamp");
            minus.classList.add("ts-decrement");
            plus.classList.add("ts-increment");
            text.classList.add("ts-note");

            minus.innerHTML = "➖";
            minus.dataset.increment = -1;
            plus.innerHTML = "➕";
            plus.dataset.increment = 1;
            updateStamp(a, time);
            li.appendChild(removeButton);
            li.appendChild(minus);
            li.appendChild(plus);
            li.appendChild(a);
            li.appendChild(text);
            list.appendChild(li);
            return text
        }

        function pasteList() {
            if (!confirm("This will replace the current list. Are you sure?")) {
                return;
            }
            var lines = box.value.split("\n");
            list.innerHTML = "";
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                var stamp = line.split(/\s+/, 1)[0];
                var time = unformatTime(stamp);
                var note = line.slice(stamp.length + 1);
                var text = newLi(time, note);
                text.value = note
            }
            list.appendChild(nowli)
        }

        function formatTime(time) {
            var h = Math.floor(time / 3600);
            var m = Math.floor(time / 60) % 60;
            var s = Math.floor(time) % 60;
            return (h ? (h + ":" + String(m).padStart(2, 0)) : m) + ":" + String(s).padStart(2, 0)
        }

        function addStamp() {
            var time = Math.max(0, Math.floor(document.querySelector("video").currentTime - offset));
            var text = newLi(time);
            list.appendChild(nowli);
            text.focus()
        }

        function resetCopier() {
            copyMode = 0;
            copier.innerHTML = "Copy List";
        }

        function showToast(message) {
            var toast = document.getElementById("ytls-toast");
            toast.innerText = message;
            toast.className = "show";
            setTimeout(function() {
                toast.className = toast.className.replace("show", "");
            }, 1500);
        }


        function copyList() {
            var string = "";
            if (copyMode === 0) {
                copyMode = 1;
                copier.innerHTML = "Copy YT Links";
                for (var i = 0; i < list.children.length - 1; i++) {
                    var stamp = list.children[i].querySelector("a").innerHTML;
                    var note = list.children[i].querySelector("input").value;
                    string += (i > 0 ? "\n" : "") + (stamp + " " + note).trim();
                }
                showToast("Copied YouTube Linked Timestamps");
            } else if (copyMode === 1) {
                copyMode = 2;
                copier.innerHTML = "Copy Markdown";
                for (var i = 0; i < list.children.length - 1; i++) {
                    var stamp = list.children[i].querySelector("a").href;
                    var note = list.children[i].querySelector("input").value;
                    string += (i > 0 ? "\n" : "") + (note + " " + stamp).trim();
                }
                showToast("Copied Markdown Timestamps");
            } else { // if (firstCopy === 2)
                resetCopier();
                for (var i = 0; i < list.children.length - 1; i++) {
                    var stamp = list.children[i].querySelector("a").href;
                    var note = list.children[i].querySelector("input").value;
                    string += (i > 0 ? "\n" : "") + `- [${note}](${stamp})`.trim();
                }
                showToast("Copied Text Timestamps");
            }
            box.value = string;
            box.select();
            navigator.clipboard.writeText(string)
                .then(() => {
                    console.log('Text copied to clipboard');
                })
                .catch(err => {
                    console.error('Error in copying text: ', err);
                });
        }

        var toast = document.createElement("div");
        toast.id = "ytls-toast";
        document.body.appendChild(toast);


        function warn(e) {
            e.preventDefault();
            e.returnValue = "Close timestamp tool?";
            return e.returnValue
        }

        list.style.maxHeight = "10em"
        list.style.overflowY = "auto";

        pane.id = "ytls-pane";
        exit.innerHTML = "&times;";
        exit.classList.add("ytls-exit");
        watchTime();
        nowtext.disabled = true;
        nowtext.value = "End of Video";
        box.id = "ytls-box";
        buttons.id = "ytls-buttons";
        paster.innerHTML = "Import List";
        adder.innerHTML = "Add Timestamp";
        copier.innerHTML = "Copy List";

        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = chrome.runtime.getURL("styles.css");
        document.head.appendChild(link);

        exit.addEventListener("click", closePane);
        list.addEventListener("click", clickStamp);
        list.addEventListener("touchstart", clickStamp);
        paster.addEventListener("click", pasteList);
        adder.addEventListener("click", addStamp);
        copier.addEventListener("click", copyList);
        window.addEventListener("beforeunload", warn);
        pane.appendChild(exit);
        nowli.appendChild(nowa);
        nowli.appendChild(nowtext);
        list.appendChild(nowli);
        pane.appendChild(list);
        pane.appendChild(box);
        buttons.appendChild(paster);
        buttons.appendChild(adder);
        buttons.appendChild(copier);
        pane.appendChild(buttons);
        document.body.appendChild(pane);
        box.focus()
    }
})();