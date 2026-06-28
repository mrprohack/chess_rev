// ==UserScript==
// @name         Chess.com Auto Annotated Moves Extractor
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically extracts moves with Brilliant/Blunder tags on Chess.com Game Review pages.
// @author       You
// @match        *://www.chess.com/analysis/game/live/*
// @match        *://www.chess.com/game/live/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Create a floating button to trigger extraction
    let btn = document.createElement("button");
    btn.innerHTML = "Extract Annotated Moves";
    btn.style.position = "fixed";
    btn.style.bottom = "20px";
    btn.style.left = "20px";
    btn.style.zIndex = "999999";
    btn.style.padding = "15px";
    btn.style.backgroundColor = "#7fa650";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.borderRadius = "8px";
    btn.style.cursor = "pointer";
    btn.style.fontSize = "16px";
    btn.style.fontWeight = "bold";
    btn.style.boxShadow = "0px 4px 6px rgba(0,0,0,0.3)";
    
    btn.onclick = function() {
        let moves = [];
        let nodes = document.querySelectorAll('.node, .move-text-component');
        
        if(nodes.length === 0) {
            alert("Please make sure the move list is visible (click the Details or Moves tab on the right) and the review is loaded.");
            return;
        }

        nodes.forEach(node => {
            let textNode = node.querySelector('span[data-cy="move-text"]') || node;
            let text = textNode.innerText.trim();
            
            let icon = node.querySelector('.icon-font-chess');
            let classification = '';
            if (icon) {
                let cls = icon.className;
                if (cls.includes('brilliant')) classification = ' [BRILLIANT!!]';
                else if (cls.includes('great')) classification = ' [GREAT!]';
                else if (cls.includes('best')) classification = ' [BEST]';
                else if (cls.includes('excellent')) classification = ' [EXCELLENT]';
                else if (cls.includes('good')) classification = ' [GOOD]';
                else if (cls.includes('inaccuracy')) classification = ' [INACCURACY?!]';
                else if (cls.includes('mistake')) classification = ' [MISTAKE?]';
                else if (cls.includes('miss')) classification = ' [MISS]';
                else if (cls.includes('blunder')) classification = ' [BLUNDER??]';
                else if (cls.includes('book')) classification = ' [BOOK]';
            }
            
            if (text) moves.push(text + classification);
        });
        
        let formatted = [];
        for(let i=0; i<moves.length; i+=2) {
            let num = Math.floor(i/2) + 1;
            let blackMove = moves[i+1] ? " " + moves[i+1] : "";
            formatted.push(num + ". " + moves[i] + blackMove);
        }
        
        let result = formatted.join('\n');
        
        // Show result in a popup
        let textArea = document.createElement("textarea");
        textArea.value = result;
        textArea.style.position = "fixed";
        textArea.style.top = "10%";
        textArea.style.left = "10%";
        textArea.style.width = "80%";
        textArea.style.height = "80%";
        textArea.style.zIndex = "9999999";
        textArea.style.fontSize = "20px";
        textArea.style.padding = "20px";
        
        let closeBtn = document.createElement("button");
        closeBtn.innerText = "Close Window";
        closeBtn.style.position = "fixed";
        closeBtn.style.top = "5%";
        closeBtn.style.right = "10%";
        closeBtn.style.zIndex = "99999999";
        closeBtn.style.fontSize = "20px";
        closeBtn.style.padding = "10px";
        closeBtn.style.backgroundColor = "#d32f2f";
        closeBtn.style.color = "white";
        closeBtn.onclick = function() { document.body.removeChild(textArea); document.body.removeChild(closeBtn); };
        
        document.body.appendChild(textArea);
        document.body.appendChild(closeBtn);
    };

    document.body.appendChild(btn);
})();
