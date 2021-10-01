const puppeteer = require('puppeteer');
const twilio = require('twilio');
var express = require('express');
const fs = require('fs');
const path = require('path')
var https = require('https');
const util = require('util');



var url = 'https://ipfs.io/ipfs/QmRNurpaKF4NQRaCTowzCubwnRSjATYM2JjEZKcUijftTj/';

var attributeTemplate = [];
var dataArray = [];

setUpEnv();

function setUpEnv()
{
  https.get(url + "1".toString(),(res2) => {
    let body = "";
    res2.on("data", (chunk) => {
        body += chunk;
    });

    res2.on("end", () => {
        try {
            let json = JSON.parse(body);
            console.log(json)
            console.log(json["attributes"].length)
            for (var j = 0; j < json["attributes"].length; j++)
            {
              //console.log(json["attributes"][j]["trait_type"])
              var temp = new Object();
              temp["attributeName"] = json["attributes"][j]["trait_type"];
              temp["values"] = [];
              attributeTemplate.push(temp)
            }
              console.log(attributeTemplate)

        } catch (error) {
            console.error(error.message);
            console.log("")

        };
    });

  })


}

main();

async function main()
{
  var start = Date.now();

  var promiseArray = [];


  for (var i = 0; i < 3500; i++)
  {
    await delay(30)
    //console.log(i)
    //var maxAttempts = 10;
    var promise = new Promise( (resolve, reject) => {
      let temp = new Object;
      temp["id"] = i;



        //console.log("inside the loop")
      https.get(url + i.toString(),(res2) => {
        let body = "";
        var thisCycle = i;
        res2.on("data", (chunk) => {
            body += chunk;
        });

        res2.on("end", () => {
            try {
                let json = JSON.parse(body);
                // do something with JSON
                //console.log(json)
                myJSON = json
                //console.log(json);

                temp["data"] = json;
                temp["rarityScore"] = 1;
                dataArray.push(temp);
                resolve();

            } catch (error) {
                console.error(error.message);
                console.log("")

            };
        });

      }).on("error", (error) => {
          console.error(error.message);
          if (error.message.includes("ECONNREFUSED"))
          {
            console.log("we will try again")

          }
          else
          {
            console.log("hard pass")

          }
      })


    })

    promiseArray.push(promise);
    console.log("promise pushed to array "+i)
  }

  console.log("[SYSTEM] All promises submitted, waiting for set to resolve...")


  // Once all promises are finished
  Promise.all(promiseArray).then((values) => {
    console.log("done")
    console.log(util.inspect(dataArray, false, null, true /* enable colors */))
    var end = Date.now();

    var difference = end - start;

    console.log("time: ")
    console.log(difference)


    concatData(dataArray);

    console.log(util.inspect(attributeTemplate, false, null, true /* enable colors */))

    calculateRarityScores();
    dataArray.sort((a, b) => (a.rarityScore < b.rarityScore) ? 1 : -1)
    console.log(util.inspect(dataArray, false, null, true /* enable colors */))

  })


}

function concatData(dataArray)
{
  for ( var i = 0, max = dataArray.length; i < max; i++)
  {
    for (var j = 0; j < dataArray[i]["data"]["attributes"].length; j++)
    {
      for (var m = 0; m < attributeTemplate.length; m++)
      {
        if (attributeTemplate[m]["attributeName"] == dataArray[i]["data"]["attributes"][j]["trait_type"])
        {
          var flag = 0;
          // Found the matching trait type
          for (var n = 0; n < attributeTemplate[m]["values"].length; n++)
          {
            if (attributeTemplate[m]["values"][n]["valueName"] == dataArray[i]["data"]["attributes"][j]["value"])
            {
              // Already found this trait
              flag = 1;
              attributeTemplate[m]["values"][n]["count"] += 1;
              break;

            }
          }

          if (flag == 0)
          {
            // Never found the entry, need to add it
            var temp = new Object();
            temp["valueName"] = dataArray[i]["data"]["attributes"][j]["value"];
            temp["count"] = 1;

            attributeTemplate[m]["values"].push(temp)
          }

          // Break
          m = attributeTemplate.length
        }
      }
    }
  }
}

function printSpecial()
{
  // for each attribute with only 1 count, find the item with that attribute and print it out here

}

function calculateRarityScores()
{
  // go through each list using the attribute template and assign a rarity score to each item
  for (var i = 0; i < dataArray.length; i++)
  {
    // For each data array obj, calculate a score and store it inside of that object
    for (var j = 0; j < dataArray[i]["data"]["attributes"].length; j++)
    {
      for (var m = 0; m < attributeTemplate.length; m++)
      {
        if (dataArray[i]["data"]["attributes"][j]["trait_type"] == attributeTemplate[m]["attributeName"])
        {
          // I found the matching table, now I needf to match up the attribute itself
          for (var b = 0; b < attributeTemplate[m]["values"].length; b++)
          {
            if (dataArray[i]["data"]["attributes"][j]["value"] == attributeTemplate[m]["values"][b]["valueName"])
            {
              // Found the matching value!
              // Lower is better
              dataArray[i]["rarityScore"] *= attributeTemplate[m]["values"][b]["count"];
            }
          }

        }
      }

    }

    /*
    for each object
      for each of the attributes
      find a match in the template (for each template item)
    */
  }

}


function delay(time) {
   return new Promise(function(resolve) {
       setTimeout(resolve, time)
   });
}

//https://ipfs.io/ipfs/QmRNurpaKF4NQRaCTowzCubwnRSjATYM2JjEZKcUijftTj/3654
