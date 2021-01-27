

var apples = [];
var fruits = [];
var yeasts = [];

//set default variables
function defaults(){
  batch = [{value: 100, color: "grey"}];
  totalPercent = 0;
  totalSG = 0;
  totalTA = 0;
  totalTannin = 0;
  colors = ["blue", "red", "green", "orange", "purple", 
  "brown", "pink", "lightblue", "lightgreen", "navy"];
  $('#f1 input[name=percent]').attr("value", 100-totalPercent);
  $('#f1 input[name=percent]').attr("max", 100-totalPercent);

}

//object constructor methods
function fruit(variety, sg, ta, ph, tannin, type){
  this.variety = variety;
  this.sg = sg;
  this.ta = ta;
  this.ph = ph;
  this.tannin = tannin;
  this.type = type;
}

function yeast(strain, attenuation){
  this.strain = strain;
  this.attenuation = attenuation;
}

//allows me to average an array if i get multiple values from one of the tables i'm referencing
function average(arr){
  if (arr && arr.length > 0) {
    var l = arr.length;
    var sum = arr.reduce((x, y) => parseFloat(x) + parseFloat(y));
    return sum / l;
  }
}

//parses the fruit table and creates 2 arrays: a table of all the fruits on the website, and a 
//table of just the apples. I found this was the most reliable way of making sure i was able to retrive all
//the apples. I use regex to parse the numbers and names, and create arrays of objects from them using
//my construtor methods. As many of the apples had multiple entries, i merged them together to make one
//object.
function parseFruitTable(table){
  $(table).find('tr').each(function(){
    var variety = $.trim($(this).find("td").eq(1).text());
    var name = variety.replace(/\W/g, "");
    var sg = average($(this).find("td").eq(2).text().match(/(\d+[.]\d+|\d+)/g));
    var ta = average($(this).find("td").eq(3).text().match(/(\d+[.]\d+|\d+)/g));
    var ph = average($(this).find("td").eq(4).text().match(/(\d+[.]\d+|\d+)/g));
    var tannin = average($(this).find("td").eq(5).text().match(/(\d+[.]\d+|\d+)/g));
    var type = $.trim($(this).find("td").eq(0).text());
    if (!type) {
      last = fruits[fruits.length - 1]
      type = fruits[last].type;
    }
    if (!name && type === fruits[last].type) {
      var a = fruits.pop();
      name = a;
      variety = fruits[a].variety;
      sg = average(new Array(sg, fruits[a].sg).filter(Number));
      ta = average(new Array(ta, fruits[a].ta).filter(Number));
      ph = average(new Array(ph, fruits[a].ph).filter(Number));
      tannin = average(new Array(tannin, fruits[a].tannin).filter(Number));
    }
    if (name) {
      fruits.push(name);
      fruits[name] = new fruit(variety, sg, ta, ph, tannin, type);
    }
    if (name && type === "Apple"){
      apples.push(name);
      apples[name] = new fruit(variety, sg, ta, ph, tannin, type);
    }
  });
}

//does the same but for the yeasts. This table was sorted much better than the fruit one so there is
//less logic needed
function parseYeastTable(table){
  $(table).find('tr').each(function(){
    var strain = $(this).find('td').eq(0).text();
    var n = strain.replace(/\W/g, "");
    var attenuation = parseFloat($(this).find('td').eq(5).text());
    if (strain !== "Name") {
    yeasts.push(n);
    yeasts[n] = new yeast(strain, attenuation);
    }
  });
}

//autopopulates the form fields with the specs of the apple selected from the select menu
function appleSelectListener(){
  $("#f1 select[name=preapples]").change(function() {
    var a = apples[this.value];
    if (a) {
      $('#f1 input[name=variety]').val(a.variety);
      $('#f1 input[name=sg]').val(a.sg);
      $('#f1 input[name=ta]').val(a.ta);
      $('#f1 input[name=tannin]').val(a.tannin);
    } else {
      $('#f1').trigger('reset');
    }
  });
}
//does the same as above for the yeast
function yeastSelectListener(){
  $("#f2 select[name=yeast]").change(function(){
    var y = yeasts[this.value];
    if (y) {
      $('#f2 input[name=attenuation]').val(y.attenuation);
    } else {
      $('#f2').trigger("reset");
    }
  })
}

//on submit, adds the apples to the blend in porportion to the percent they make up
function appleSubmitListener(){
  $("#f1").submit(function(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    var variety = $('#f1 input[name=variety]').val();
    var sg = $('#f1 input[name=sg]').val();
    var ta = $('#f1 input[name=ta]').val();
    var tannin = $('#f1 input[name=tannin]').val();
    var p = $('#f1 input[name=percent]').val();
    var percent = p / 100;
    totalPercent += p * 1;
    batch[0].value -= p;
    totalSG +=  sg * percent;
    totalTA += ta * percent;
    totalTannin += tannin * percent;
    batch.push({value: p, label: variety, color: colors.shift()});
    blendPieChart.destroy();
    blendPieChart = new Chart(ctx).Pie(batch);    
    $('#f1 input[name=percent]').attr("value", 100-totalPercent);
    $('#f1 input[name=percent]').attr("max", 100-totalPercent);
    $('#f1').trigger('reset');
    checkIfFinished();
  });
}

//calculates the ABV and FG of the cider
function yeastSubmitListener(){
  $('#f2').submit(function(event){
    event.preventDefault();
    event.stopImmediatePropagation();
    var atten = $('#f2 input[name=attenuation]').val();    
    var fg = totalSG - ((((totalSG * 1000) - 1000) * (atten / 100)) / 1000);
    var eabv = (1.05/0.79) * ((totalSG - fg) / fg)  * 100;
    $('#finished').append("<li>Estimated Final Gravity: " + fg.toFixed(4) + "</li><br/>");
    $('#finished').append("<li>Estimated ABV: " + eabv.toFixed(2) + "%</li><br/>");
  })
}

//allows the form to be reset
function resetListener(){
  $("#reset").click(function(event) {
    defaults();
    $('#f1').trigger('reset');
    $('#f2').trigger('reset');
    $('#abv').hide();
    $('#spec').hide();
    $('#blendspec').empty();
    $('#finished').empty();
    blendPieChart.destroy();
    blendPieChart = new Chart(ctx).Pie(batch);
  });
}

//checks if the batch is at 100%, if so then displays stats on the blend and allows choosing a yeast
function checkIfFinished(){
  if (totalPercent === 100) {
    $('#spec').show();
    $('#abv').show();
    $('#blendspec').append("<li>Specific Gravity: " + totalSG.toFixed(4) + "</li><br/>");
    $('#blendspec').append("<li>Titratable Acidity: " + totalTA.toFixed(4) + "</li><br/>");
    $('#blendspec').append("<li>Tannins: " + totalTannin.toFixed(4) + "</li>");
  }
}


$(document).ready(function(){
  //initalizing variables and the pie chart for the apples
  defaults();
  ctx = $("#blendChart").get(0).getContext("2d");
  blendPieChart = new Chart(ctx).Pie(batch);
  
  //fruit table
  $.ajax({
    url: 'http://crossorigin.me/http://www.brsquared.org/wine/CalcInfo/FruitDat.htm',
    dataType: 'html',
    timeout: 10000,
    dataFilter: function(data){
      return $(data).filter('table')[1];
    }
  })
  .done(function(data) {
    derp = data;
    parseFruitTable(data);
     $.each(apples, function(val, text){
      $("#f1 select[name=preapples]").append($("<option />").val(apples[val]).html(apples[text].variety));
    });
  })
  .fail(function(data) {
    console.log("error");
  })
  .always(function() {
       
  });

//yeast table
  $.ajax({
  url: 'http://crossorigin.me/http://www.brewunited.com/yeast_database.php',
  dataType: 'html',
  timeout: 10000,
  dataFilter: function(data){
      return $(data).find('table');
    }
  })
  .done(function(data) {
    parseYeastTable(data);
    $.each(yeasts, function(val, text){
      $("#f2 select[name=yeast]").append($("<option />").val(yeasts[val]).html(yeasts[text].strain));
    });
  })
  .fail(function() {
    console.log("error");
  })
  .always(function() {
    console.log("complete");
  });

  //initilaizing listeners for the buttons!
  appleSelectListener();
  yeastSelectListener();
  appleSubmitListener();
  yeastSubmitListener();
  resetListener();



 
});

