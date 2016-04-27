/**
 * Created by christian on 24.04.2016.
 */

/*
 Story telling script by Christian Simonsen
 April 2016
 */

var STORY = 0;
var DEFINITIONS = 1;

var sourceFile = "jungeltrobbel.txt"; // eksempel "Kua.txt"
var rawData = null;
var storyStructure = null;
var pageIndex = 0;
var lastPage = 0;
var currentKey = 0;
var audioIndex = 0;

var audioQue = [];

jQuery(document).ready(function(){
    /*fetchStory(sourceFile).done(function(){
     rawData = rawData;
     parseRawStory(rawData);
     tellStory();
     });*/
    rawData = $("#historieText").html();
    parseRawStory(rawData);
    tellStory();

});

function showOptions(key){
    currentKey = key;
    var dictionary = storyStructure.dictionary["key_" + key];
    var actions = "";
    for(var i in dictionary){
        var word = dictionary[i].word;
        var imagefile = dictionary[i].image;
        var audioFile = dictionary[i].sounds[0];

        var action = "<div class='col-md-2 text-center col-centered' onclick='pickOption(\"" + i + "\")'>";

        if(imagefile != ""){
            action += "<img width='160px' class='img-rounded' src='img/"+ imagefile +"' alt='"+ word +"'>";
        }

        if(audioFile != ""){
            action += "<audio id=\"audio_" + word + "\" src='audio/" + audioFile.trim() +"' />";
        }

        action += "<p class='smaller'>"+word+"</p></div>";
        actions += action;
    }
    $("#options").html(actions);
}

function pickOption(index){
    var option = storyStructure.dictionary["key_" + currentKey][index];
    $("#key_" + currentKey).text(option.word);
    storyStructure.choice["key_" + currentKey] = option;
    $("#options").html("");

    var audio = $("#soundPlayer")[0];
    audio.src = "audio/" + option.sounds[0].trim();
    audio.onended = function(){
        audioIndex++;
        playAudio();
    };
    audio.play();
}

function tellStory(){
    pageIndex = 0;
    lastPage = storyStructure.story.length;
    showPage(pageIndex);
}

function showFullStory(){
    var fullStory = "";
    audioQue = [];
    for(i in storyStructure.story){
        fullStory += renderTextPage(i,false);
        audioQue = audioQue.concat(queAudio(i));
    }
    $("#story").html(fullStory);
    playAudio();
}

function nextPage(){
    pageIndex++;
    if(pageIndex < lastPage){
        showPage(pageIndex);
    }else {
        pageIndex = lastPage;
        showFullStory();
    }
}

function previousPage(){
    pageIndex--;
    if(pageIndex > 0){
        showPage(pageIndex);
    }else {
        pageIndex = 1;
    }
}

function showPage(page){
    $("#story").html(renderImage(page) + "<span class='col-md-12 pos'>" + renderTextPage(page) + "</span>");
    audioQue = queAudio(page)
    playAudio();
}

function playAudio(){

    if(audioQue && audioQue.length > audioIndex){

        var sound = audioQue[audioIndex].trim();

        if(sound != undefined){
            var keyPattern = /(\d+)/g;
            if(sound[0] == "["){
                var matches = sound.match(keyPattern);//sound.match(keyPattern)[0];
                var key = matches[0];
                var offset = (matches[1] != undefined) ? (matches[1]*1)-1:0;
                var choice = storyStructure.choice["key_" + key];

                if(choice != undefined){
                    sound = choice.sounds[offset].trim();
                } else{
                    sound = ""
                }
            }

            if(sound != ""){
                var audio = $("#soundPlayer")[0];
                audio.src = "audio/" + sound.trim();
                audio.onended = function(){
                    audioIndex++;
                    playAudio();
                };
                audio.play();
            }
        }
    }

}

function queAudio(page){
    console.log("Que audio " + page);
    audioIndex = 0;
    return storyStructure.audio[page];
}

function renderImage(page){
    console.log("Render image " + page);
    var image = storyStructure.images[page];
    var img = "";
    console.log("img " + image);
    if(image != "" && image !== "ingen"){
        img = "<img src=\"img/"+ image +"\" class='backgroundImage' />";
    }
    return img
}

function renderTextPage(page,buttons){
    console.log("Render text" + page);
    var rawPage = storyStructure.story[page].toUpperCase();

    var parsedPage  = "<p>"+ rawPage +"</p>";
    var pattern = /(\[\d\])/g;
    var keyPattern = /(\d+)/g;
    var refPattern = /(\[\?\d\])/g;
    var matches = null;

    var renderButtons = (buttons != undefined) ? buttons:true;

    if(pattern.test(rawPage) || refPattern.test(rawPage)){
        matches = rawPage.match(pattern);
        for(i in matches){
            var match = matches[i];
            var key = match.match(keyPattern)[0];

            var disp = "...........";

            if( storyStructure.choice["key_" + key]){
                disp = storyStructure.choice["key_" + key].word; //.replace(/(\[\?\d\])/,"");
            }

            var action = "<span class='btn btn-info' id='key_" + key + "' onclick='showOptions(" + key + ")'>" +disp + "</span>";
            if(renderButtons){
                parsedPage = parsedPage.replace(match, action);
            } else{
                parsedPage = parsedPage.replace(match, disp);
            }
        }

        if(refPattern.test(parsedPage)){
            matches = rawPage.match(refPattern);
            for(i in matches){
                match = matches[i];
                key = match.match(keyPattern)[0];
                var word = storyStructure.choice["key_" + key].word;
                if(word != undefined){
                    parsedPage = parsedPage.replace(match.trim(),word.trim());
                } else{
                    parsedPage = parsedPage.replace(match.trim(),"..........");
                }
            }
        }
    }

    return parsedPage;
}

function parseRawStory(raw){
    var sections = raw.split("----------");
    if(sections.length != 2){
        alert("Historie filen " + sourceFile + " inneholder en feil. Mest sansynlig er det skillet mellom historien og bitene som skal være eksakt 10 - på en linje");
        return;
    }
    storyStructure = {};
    storyStructure.dictionary = extractDictionary(sections[DEFINITIONS].split("\n"));
    var story = sections[STORY].split("\n");

    if(story[0] == ""){
        story = story.slice(1);
    }

    console.log(story);

    storyStructure.story = extractStory(story);
    storyStructure.images = extractImages(story);
    storyStructure.audio = extractAudio(story);
    storyStructure.choice = [];
}

function extractImages(raw){
    var images = [];
    for(var i in raw){
        var next = (i*1) + 1;
        if(raw[i].trim() != "" && raw[next] != undefined && raw[next].trim() == ""){
            var parts = raw[i].split(",");
            var img = parts[0].trim();
            images.push(img);
        }
    }
    return images;
}

function extractAudio(raw){
    var audio = [];
    for(var i in raw){
        var next = (i*1) + 1;
        if(raw[i].trim() != "" && raw[next] != undefined && raw[next].trim() == ""){
            var parts = raw[i].split(",");
            var fi = parts.slice(1);
            audio.push(fi);
        }
    }
    return audio;
}

function extractStory(raw){
    var story = [];
    for(var i in raw){
        if(raw[i] != "" && i%3 == 0){
            story.push(raw[i].toUpperCase());
        }
    }
    return story;
}

function extractDictionary(raw){
    var dictionary = [];
    var pattern = /(\[\d\])/g;
    var keyPattern = /(\d+)/g;

    for(i in raw){
        var entry = raw[i];
        if(pattern.test(entry)){
            var key = entry.match(keyPattern)[0];
            var alt = entry.replace(pattern,"").trim().split("|");
            var wordList = [];
            for(var i in alt){
                var item = alt[i].split(",")
                wordList.push({word:item[0].trim().toUpperCase(), image:item[1].trim(), sounds:item.slice(2) });
            }

            dictionary["key_"+key] = wordList;
        }
    }

    return dictionary;
}

function fetchStory(source) {
    return $.get("doc/" + source +"?k=" + Date.now(), function (data) { rawData = data;});
}