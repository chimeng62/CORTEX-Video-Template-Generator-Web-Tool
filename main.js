// Import dependency
var urlParser = require('js-video-url-parser');

// initialise the input output editors
setupInputEditor();
setupOutputEditor();

// Add click events to buttons
document.querySelector('#run').addEventListener('click', run);
document.querySelector('#copy').addEventListener('click', copyOutput);

// This variable is for requesting to the API
var apiKey = 'AIzaSyDBYVgCATp-oO7PCaJLvg6wZyl3gmTDwz4';

//Check vimeo links
var isVimeoVideoFound = true;

//  Pre-connect to Youtube api to speed up the generating process
setTimeout(function() {
  loadYoutubeClient();
}, 500);

var youtubeResponseTotal = '';
//This function is called by the Generate button
async function run() {
  //Only run if the input is more than 10 chars
  if (isValidUrl == true) {
    getUrls();

    //Only send requests to Youtube if urls exist
    if (youtubeVideoID) {
      await youtubeRequest();

      youtubeResponseTotal = youtubeResponse.result.pageInfo.totalResults;
      findYoutubeUrlError();
    }

    await vimeoRequest();
    //Show errors
    if (isVimeoVideoFound == false && youtubeUrlCounter == youtubeResponseTotal) {
      outputEditor.setValue('');
      showErrorMsg('.outputMessage1', `Error: ${vimeoErrorUrlCounter} of ${vimeoUrlCounter} Vimeo links are broken or inaccessible through the API.`);
      showErrorMsg('.outputMessage2',`Broken Vimeo url(s): </br>${vimeoErrorUrl}</br>
      Reason: Uploaders can set the privacy setting of their Vimeo videos to "Embed only", therefore they can't be found anywhere else on the web.`);

    } else if (isVimeoVideoFound == true && youtubeUrlCounter !== youtubeResponseTotal) {
      outputEditor.setValue('');
      showErrorMsg('.outputMessage1', `Error: ${youtubeUrlCounter-youtubeResponseTotal} of ${youtubeUrlCounter} Youtube links are broken. Please check.`);
      showErrorMsg('.outputMessage2',`Broken Youtube video ID(s): </br>${youtubeErrorUrl}</br>`);

    } else if (isVimeoVideoFound == false && youtubeUrlCounter !== youtubeResponseTotal) {
      outputEditor.setValue('');
      showErrorMsg('.outputMessage1', `Error: ${youtubeUrlCounter-youtubeResponseTotal} of ${youtubeUrlCounter} Youtube links are broken and </br>${vimeoErrorUrlCounter} of ${vimeoUrlCounter}  Vimeo links are broken or inaccessible through the API.`);
      showErrorMsg('.outputMessage2',`Broken Vimeo url(s): </br>${vimeoErrorUrl}</br>
      Broken Youtube video ID(s): </br>${youtubeErrorUrl}</br>
      Reason: Uploaders can set the privacy setting of their Vimeo videos to "Embed only", therefore they can't be found anywhere else on the web.`);

    } else {
      hideErrorMsg('.outputMessage1');
      hideErrorMsg('.outputMessage2');
      printOutput();
    }
  }
}

function printOutput() {
  printTitle();
  printIframe();
}

//initiate error message container
var node = outputEditor.renderer.emptyMessageNode;
node = outputEditor.renderer.emptyMessageNode = document.createElement('div');
node.className = 'outputMessage1';
outputEditor.renderer.scroller.appendChild(node);

var node = outputEditor.renderer.emptyMessageNode;
node = outputEditor.renderer.emptyMessageNode = document.createElement('div');
node.className = 'outputMessage2';
outputEditor.renderer.scroller.appendChild(node);

function showErrorMsg(outputClass, errMsg) {
  document.querySelector(outputClass).innerHTML = errMsg;
}

function hideErrorMsg(outputClass) {
  var node = outputEditor.renderer.emptyMessageNode;
  if (node) {
    document.querySelector(outputClass).innerHTML = '';
  }
}

//Variable for storing just the video id not the entire youtube url
//Youtube API only accept video ids not the full url
var youtubeVideoIdArr = [];
var youtubeVideoID = '';

//Vimeo accepts OEMBED so full url is accepted and no api key is needed
var vimeoUrlArr = [];

//////////////////////////////////////////////////////////
//////////////////Youtube request section/////////////////
//////////////////////////////////////////////////////////

//This function loads the API using the api key
function loadYoutubeClient() {
  gapi.client.setApiKey(apiKey);
  return gapi.client.load('https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest')
    .then(function() {},
      function(err) {
        console.error('Error loading GAPI client for API', err);
      });
}

//Youtube error checking
var youtubeErrorUrlArr = [];
var youtubeErrorUrl = '';
var youtubeResponseVideoId=[];


function findYoutubeUrlError() {
  getyoutubeResponseVideoIdArr();
	//Compare Youtube Video Ids sent against the response form Youtube
  youtubeErrorUrlArr = arrDiff(youtubeVideoIdArr, youtubeResponseVideoId);

  youtubeErrorUrlArr.forEach(function(element) {
    youtubeErrorUrl = youtubeErrorUrl + `&bullet; ${element}</br>`;
  })
}

function getyoutubeResponseVideoIdArr(){
  for(let i=0;i<youtubeResponse.result.items.length;i++){
   youtubeResponseVideoId.push(youtubeResponse.result.items[i].id);
  }
}


var youtubeResponse = [];
// Sends request to Youtube
function youtubeRequest() {
  return gapi.client.youtube.videos.list({
      'part': 'snippet,contentDetails',
      'id': youtubeVideoID
    })
    .then(function(response) {
        youtubeResponse = response;
      },
      function(err) {
        console.error('Execute error', err);
      });
} //end function

gapi.load('client');



//Compare elements between 2 arrays and returns the different elements
function arrDiff(arr1, arr2) {
  var arrays = [arr1, arr2].sort((a, b) => a.length - b.length);
  var smallSet = new Set(arrays[0]);

  return arrays[1].filter(x => !smallSet.has(x));
}
//////////////////////////////////////////////////////////
/////////////////End Youtube request section//////////////
//////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////
///////////////////Vimeo request section//////////////////
//////////////////////////////////////////////////////////
var vimeoErrorUrlCounter = 0;
var vimeoErrorUrl='';
//This function takes in a full Vimeo url
function vimeoFetch(url) {
  return fetch('https://vimeo.com/api/oembed.json?url=' + url) // return this promise
    .then((resp) => resp.json())
    .catch((err) => {
      isVimeoVideoFound = false;
      vimeoErrorUrlCounter++;
      //For error checking: showing which urls are error
      vimeoErrorUrl = vimeoErrorUrl + `&bullet; ${url}</br>`;
    });
}

var vimeoResponse = [];

//Send request to Vimeo
async function vimeoRequest() {
  //reset counter
  vimeoErrorUrlCounter = 0;
  var counter = 0;

  for (var o = 0; o < vimeoUrlArr.length; o++) {
    if (vimeoUrlArr[o]) {

      await vimeoFetch(vimeoUrlArr[o])
        .then(function(data) {
          vimeoResponse[counter] = data;
          counter++;
        })
    }
  } //end for loop
} //end function

//////////////////////////////////////////////////////////
///////////////////End Vimeo request section//////////////
//////////////////////////////////////////////////////////

//counter for youtube urls
var youtubeUrlCounter = 0;
var vimeoUrlCounter = 0;
// This function gets urls from the input editor
function getUrls() {
  //Reset arrays
  vimeoUrlArr = [];
  youtubeVideoIdArr = [];
  youtubeVideoID = '';
  //Reset Youtube error checking
  youtubeErrorUrlArr = [];
  youtubeErrorUrl = '';
  youtubeResponseVideoId=[];
  youtubeResponseTotal=0;
  youtubeUrlCounter = 0;
  vimeoUrlCounter = 0;
  //Reset video checking
  isVimeoVideoFound = true;
  vimeoErrorUrl='';

  //Get all lines from the input editor
  var urls = inputEditor.session.doc.getAllLines();
  var urlCounter = 0;

  for (var i = 0; i < urls.length; i++) {

    //parse each line, if returned 'undefined': not a correct url
    var parsedUrl = urlParser.parse(urls[i]);
    if (parsedUrl) {
      if (parsedUrl.provider == 'youtube') {

        //for requesting to Youtube Api
        youtubeVideoID = youtubeVideoID + ',' + parsedUrl.id;
        //For printing youtube iframe
        youtubeVideoIdArr[urlCounter] = parsedUrl.id;

        urlCounter++;
        youtubeUrlCounter++;
      }

      //if vimeo url, add the full url to vimeoUrlArr array
      if (parsedUrl.provider == 'vimeo') {

        //Use urlParser.prase(url[i]) and then create link using below
        var createdUrl = urlParser.create({
          videoInfo: {
            provider: parsedUrl.provider,
            id: parsedUrl.id,
            mediaType: parsedUrl.mediaType,
          }
        })
        vimeoUrlArr[urlCounter] = createdUrl;
        vimeoUrlCounter++;
        urlCounter++;
      }
    } //end check returned value
  } //end for loop
} //end function

//////////////////////////////////////////////////////////
////////////////////Print section/////////////////////////
//////////////////////////////////////////////////////////

//This function prints out titles of the videos in li
function printTitle() {

  //Clear output editor
  outputEditor.setValue('');

  var videoNumber = 0;

  //Add <ol>
  outputEditor.session.insert(0, '<ol>');
  addEmptyLine();

  //Get the biggest array
  var arrSize = getBiggestArr(vimeoUrlArr, youtubeVideoIdArr);
  var vimeo = 0;
  var youtube = 0;
  for (var r = 0; r < arrSize; r++) {

    //Print vimeo titles
    if (vimeoUrlArr[r]) {
      var title = vimeoResponse[vimeo].title;
      var duration = convertVimeoDuration(vimeoResponse[vimeo].duration);
      var li = `  <li><strong>Video #${++videoNumber} ${title} (Duration: ${duration})</strong></li>`;
      outputEditor.session.insert(0, li);
      addEmptyLine();
      vimeo++;
    }

    //Print youtube titles
    if (youtubeVideoIdArr[r]) {
      var title = youtubeResponse.result.items[youtube].snippet.title;
      var duration = convertYoutubeDuration(youtubeResponse.result.items[youtube].contentDetails.duration);
      var li = `  <li><strong>Video #${++videoNumber} ${title} (Duration: ${duration})</strong></li>`;
      outputEditor.session.insert(0, li);
      addEmptyLine();
      youtube++;
    }
  }

  //Add </ol>
  outputEditor.session.insert(0, '</ol>');
  addEmptyLine();
} //end function

//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////

function printIframe() {
  outputEditor.session.insert(0, '<p>');
  //Get the biggest array
  var arrSize = getBiggestArr(vimeoUrlArr, youtubeVideoIdArr);
  var vimeo = 0;
  var youtube = 0;
  for (var r = 0; r < arrSize; r++) {
    addEmptyLine();
    //Print vimeo titles
    if (vimeoUrlArr[r]) {
      var videoId = vimeoResponse[vimeo].video_id;
      var iframe = `  <iframe width='120' height='120' src='https://player.vimeo.com/video/${videoId}?color=ffffff&amp;title=0&amp;byline=0&amp;portrait=0' frameborder='0' webkitallowfullscreen='' mozallowfullscreen='' allowfullscreen=''></iframe>`;
      outputEditor.session.insert(r, iframe);
      addEmptyLine();
      vimeo++;
    }

    //Print youtube titles
    if (youtubeVideoIdArr[r]) {
      var iframe = `  <iframe width='120' height='120' src='https://www.youtube.com/embed/${youtubeVideoIdArr[r]}?rel=0;showinfo=0' frameborder='0' allowfullscreen=''></iframe>`;
      outputEditor.session.insert(0, iframe);
      addEmptyLine();
      youtube++;
    }
  }
  outputEditor.session.insert(0, '</p>');
}

//Find the biggest array between vimeoUrlArr and youtubeVideoIdArr
function getBiggestArr(arr1, arr2) {
  var arrSize = 0;
  if (arr1.length > arr2.length) {
    arrSize = arr1.length;
  } else if (arr1.length < arr2.length) {
    arrSize = arr2.length;
  } else {
    arrSize = arr1.length;
  }
  return arrSize;
}

//////////////////////////////////////////////////////////
/////////////////////End Print section////////////////////
//////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////
///////////////////Counter section////////////////////////
//////////////////////////////////////////////////////////

//Calls updateUrlCounter function when inputEditor changes
inputEditor.on('change', updateUrlCounter);

var totalUrl = 0;
var youtubeCounter = 0;
var vimeoCounter = 0;

//  Get elements
var youtubeCounterElement = document.querySelector('#youtubeCounter');
var vimeoCounterElement = document.querySelector('#vimeoCounter');

//  Assigns default value to the counter
youtubeCounterElement.innerHTML = ` ${youtubeCounter}`;
vimeoCounterElement.innerHTML = ` ${vimeoCounter}`;

var youtubeFlashTime = 0;
var vimeoFlashTime = 0;

//Variables for checking
var isValidUrl = false;
var isAtleastOneMatch = false;
// This function outputs values to counter div element
function updateUrlCounter() {

  // Reset values
  youtubeCounter = 0;
  vimeoCounter = 0;

  // Get all lines from the input editor
  var urls = inputEditor.session.doc.getAllLines();


  if (inputEditor.session.getValue().length < 1) {
    isAtleastOneMatch = false;
  }

  for (var i = 0; i < urls.length; i++) {
    // parse each line, if returned 'undefined': not a correct url
    var parsedUrl = urlParser.parse(urls[i]);
    if (parsedUrl) {
      if (parsedUrl.provider === 'youtube') {
        youtubeCounter++;
        isValidUrl = true;
        isAtleastOneMatch = true;
      } else if (parsedUrl.provider === 'vimeo') {
        vimeoCounter++;
        isValidUrl = true;
        isAtleastOneMatch = true;
      }
    } else if (isAtleastOneMatch == false) {
      isValidUrl = false;
    } // end check returned value
  } // end for loop

  vimeoCounterElement.innerHTML = ` ${vimeoCounter}`;
  youtubeCounterElement.innerHTML = ` ${youtubeCounter}`;

  // Add flash effect to counters when value changes
  if (youtubeCounter > youtubeFlashTime || youtubeCounter < youtubeFlashTime) {
    youtubeFlashTime = youtubeCounter;
    youtubeCounterElement.classList.add('youtubeCounterFlash');
    setTimeout(function() {
      youtubeCounterElement.classList.remove('youtubeCounterFlash');
    }, 500);
  }
  if (vimeoCounter > vimeoFlashTime || vimeoCounter < vimeoFlashTime) {
    vimeoFlashTime = vimeoCounter;
    vimeoCounterElement.classList.add('vimeoCounterFlash');
    setTimeout(function() {
      vimeoCounterElement.classList.remove('vimeoCounterFlash');
    }, 500);
  }
} // End function

//////////////////////////////////////////////////////////
/////////////////End Counter section//////////////////////
//////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////
///////////////////Input & Output setup///////////////////
//////////////////////////////////////////////////////////
function setupInputEditor() {
  window.inputEditor = ace.edit('input');
  inputEditor.setTheme('ace/theme/tomorrow_night_eighties');
  inputEditor.getSession().setMode('ace/mode/html');
  inputEditor.on('input', updateInput);
  setTimeout(updateInput, 100);

  inputEditor.focus();

  inputEditor.setOptions({
    fontSize: '10.5pt',
    showLineNumbers: true,
    showGutter: true,
    vScrollBarAlwaysVisible: false,
    wrap: true
  });

  inputEditor.setShowPrintMargin(false);
  inputEditor.setBehavioursEnabled(false);
  inputEditor.getSession().setUseWorker(false);
}

function updateInput() {
  var shouldShow = !inputEditor.session.getValue().length;
  var node = inputEditor.renderer.emptyMessageNode;
  if (!shouldShow && node) {
    inputEditor.renderer.scroller.removeChild(inputEditor.renderer.emptyMessageNode);
    inputEditor.renderer.emptyMessageNode = null;
  } else if (shouldShow && !node) {
    node = inputEditor.renderer.emptyMessageNode = document.createElement('div');
    node.textContent = "Paste the whole HTML of an item and make sure there's only one link on each line"
    node.className = 'emptyMessage'
    inputEditor.renderer.scroller.appendChild(node);
  }
}

function setupOutputEditor() {
  window.outputEditor = ace.edit('output');
  outputEditor.setTheme('ace/theme/tomorrow_night_eighties');
  outputEditor.getSession().setMode('ace/mode/html');

  outputEditor.setOptions({
    fontSize: '10.5pt',
    showLineNumbers: true,
    showGutter: true,
    vScrollBarAlwaysVisible: false,
    wrap: true
  });

  outputEditor.setShowPrintMargin(false);
  outputEditor.setBehavioursEnabled(false);
}

//////////////////////////////////////////////////////////
/////////////////End Input & Output setup/////////////////
//////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////
/////////////////////////Copy function////////////////////
//////////////////////////////////////////////////////////


function copyOutput() {
  if (outputEditor.session.getValue().length > 0) {
    var copyTextarea = document.querySelector('#copiedText');
    copyTextarea.value = outputEditor.getValue();
    copyTextarea.select();
    document.execCommand('copy');

    // Reset textarea
    copyTextarea.value = '';

    //Add flashStart class to overlay div to create a flash effect when copyOutput is called
    document.querySelector('.copyAlert').classList.add('flash');
    setTimeout(function() {
      document.querySelector('.copyAlert').classList.remove('flash');
    }, 500);
  }
}

//Create an overlay over outputEditor
copyAlertOverlay();

function copyAlertOverlay() {
  var node = document.createElement('div');
  node.className = 'copyAlert';
  document.querySelector('#output .ace_scroller .ace_content').appendChild(node);
}

//////////////////////////////////////////////////////////
///////////////////////End Copy function//////////////////
//////////////////////////////////////////////////////////

//This function adds an empty line to the output editor
function addEmptyLine() {
  outputEditor.session.insert({
    row: outputEditor.session.getLength(),
    column: 0
  }, '\n');
}

//This function converts seconds to HH:MM::SS format
function convertVimeoDuration(Seconds) {
  var hours = Math.floor(Seconds / 3600);
  var minutes = Math.floor((Seconds - (hours * 3600)) / 60);
  var seconds = Seconds - (hours * 3600) - (minutes * 60);

  // round seconds
  seconds = Math.round(seconds * 100) / 100;
  var result = '';

  if (hours > 0) {
    result += (hours < 10 ? +hours : hours);
    result += ':';
  }
  if (minutes > 0) {
    result += (minutes < 10 ? '0' + minutes : minutes);
  } else if (minutes < 1) {
    result += '0';
  }
  result += ':';
  result += (seconds < 10 ? '0' + seconds : seconds);
  return result;
}

//This function converts ISO 8601 duration to HH:MM:SS format
function convertYoutubeDuration(t) {
  //dividing period from time
  var x = t.split('T'),
    duration = '',
    time = {},
    period = {},
    //just shortcuts
    s = 'string',
    v = 'variables',
    l = 'letters',
    // store the information about ISO8601 duration format and the divided strings
    d = {
      period: {
        string: x[0].substring(1, x[0].length),
        len: 4,
        // years, months, weeks, days
        letters: ['Y', 'M', 'W', 'D'],
        variables: {}
      },
      time: {
        string: x[1],
        len: 3,
        // hours, minutes, seconds
        letters: ['H', 'M', 'S'],
        variables: {}
      }
    };
  //in case the duration is a multiple of one day
  if (!d.time.string) {
    d.time.string = '';
  }

  for (var i in d) {
    var len = d[i].len;
    for (var j = 0; j < len; j++) {
      d[i][s] = d[i][s].split(d[i][l][j]);
      if (d[i][s].length > 1) {
        d[i][v][d[i][l][j]] = parseInt(d[i][s][0], 10);
        d[i][s] = d[i][s][1];
      } else {
        d[i][v][d[i][l][j]] = 0;
        d[i][s] = d[i][s][0];
      }
    }
  }
  period = d.period.variables;
  time = d.time.variables;
  time.H += 24 * period.D +
    24 * 7 * period.W +
    24 * 7 * 4 * period.M +
    24 * 7 * 4 * 12 * period.Y;

  if (time.H) {
    duration = time.H + ':';
    if (time.M < 10) {
      time.M = '0' + time.M;
    }
  }

  if (time.S < 10) {
    time.S = '0' + time.S;
  }

  duration += time.M + ':' + time.S;
  return duration;
}
