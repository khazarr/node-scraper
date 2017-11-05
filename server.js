var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();

app.get('/scrape', function(req, res) {

  function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
  }

  const url = 'https://cracovia.pl/hokej/slizgawki';

  request(url, function(err, response, html) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    if (!err) {
      const $ = cheerio.load(html);
      const dataFromPage = [];

      $('p').each(function(i, elem) {
        dataFromPage[i] = $(this).text();
      });

      //extract only data with dates (regex does not work properly)
      var firstThing = dataFromPage[0]
      var firstIndex = dataFromPage.indexOf(firstThing, 1);
      var secondIndex = dataFromPage.indexOf(firstThing, firstIndex + 1);
      const cleanedData = dataFromPage.slice(firstIndex + 1, secondIndex);

      //use regex to check if multiple dates in one line
      const reg = /\d{2}.\d{2}.\d{4}/gi;
      const processedData = [];

      cleanedData.map(el => {
        let match = el.match(reg);
        if (match.length == 1) {
          processedData.push(el)
        } else {
          for (let i = 0; i < match.length - 1; i++) {
            var firstIndex = el.indexOf(match[i]);
            var secondIndex = el.indexOf(match[i + 1]);
            if (secondIndex == -1) {
              secondIndex = 0;
            }
            processedData.push(el.slice(firstIndex, secondIndex));
          }

        }

      })

      //TO DO
      //extract specific info - date,time,hours
      //store it in JSON Object
      const finalOutput = []
      processedData.map(element => {
        let obj = {
          date: '',
          day: '',
          hours: []
        };
        //clean up string
        let str = element;
        str = replaceAll(str, ',', '');
        str = str.replace(':', '');
        str = str.replace(')', '');
        str = str.replace('(', '');

        //there are two types of space in scraped website

        str = encodeURIComponent(str)
        str = replaceAll(str, '%C2%A0', 'X')
        str = replaceAll(str, '%20', 'X')
        str = decodeURIComponent(str)
        let splited = str.split('X');

        obj.date = splited[0]
        obj.day = splited[1]

        for (let i = 2; i < splited.length; i++) {
          obj.hours.push(splited[i]);
        }

        finalOutput.push(obj);

      })


      fs.writeFile('output.json', JSON.stringify(finalOutput, null, 4), function(err) {
        console.log('File successfully written! - Check your project directory for the output.json file');
        console.log('Timestamp: ' + new Date())
      });

      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(finalOutput));
    }
  })

})

app.listen('8081')
console.log('*****************************');
console.log('Up and running!')
console.log('Magic happens on port http://localhost:8081/scrape');
console.log('*****************************');

exports = module.exports = app;
