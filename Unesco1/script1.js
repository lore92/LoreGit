
var margin = {t:50,l:50,b:50,r:50},
    width  = $('.canvas').width()-margin.l-margin.r,
    height = $('.canvas').height()-margin.t-margin.b,
    padding = 10;

var svg = d3.select('.canvas')
    .append('svg')
    .attr('width',width+margin.l+margin.r)
    .attr('height',height+margin.t+margin.b)
    .append('g')
    .attr('transform',"translate("+margin.l+","+margin.t+")");

var projection = d3.geo.mercator()
      .translate([width/2, height/2])
      .scale(150);
    
var path = d3.geo.path()
      .projection(projection);

var scrollController = new ScrollMagic.Controller({
    globalSceneOptions:{
      triggerHook:'onLeave'
    }
  });

var scene1 = new ScrollMagic.Scene({
    duration:document.getElementById('scene-1').clientHeight, //controlled by height of the #scene-1 <section>, as specified in CSS
    triggerElement:'#scene-1',
    reverse:true //should the scene reverse, scrolling up?
  })
  .on('enter',function(){
    d3.select('#plot').transition().style('background','rgb(250,250,250)');
  })
  .addTo(scrollController);

var scene2 = new ScrollMagic.Scene({
    duration:document.getElementById('scene-2').clientHeight, //controlled by height of the #scene-1 <section>, as specified in CSS
    triggerElement:'#scene-2',
    reverse:true //should the scene reverse, scrolling up?
  })
  .on('enter',function(){
    d3.select('#plot').transition().style('background','rgb(250,200,200)');
  })
  .addTo(scrollController);


//------------------------------------------------------------------------Scales
var scaleR = d3.scale.sqrt().range([0,50]).domain([0,47]);
    
var newValue;
var values;

//------------------------------------------------------------------------load data     
queue()
      .defer(d3.json, "data/countries.geo.json")
      .defer(d3.csv, "data/vhc_g_cl.csv", parseData)
      .await(function(err, dataLoaded, DataSite_){

      var siteByCountry = d3.map();
      var centroidByCountry = d3.map();

      var DataSite=d3.nest()
       .key(function(d) {return d.state;})
       .key(function(d) {return d.category;})
       .sortKeys(d3.ascending)
       .entries(DataSite_)


      var center = dataLoaded.features.map(function(d){
                var centroid = path.centroid(d);
                centroidByCountry.set(d.properties.name, centroid)
                return {        
                    state:d.properties.name,
                    x0:centroid[0],
                    y0:centroid[1],
                    x:centroid[0],
                    y:centroid[1],
                                    
            };
          })

     // console.log(centroidByCountry)
      DataSite.forEach(function(eachState){
      
        var total = 0;
            eachState.values.forEach(function(eachCategory) {
                
                totalCatgory = eachCategory.values.length      
                eachCategory.total = totalCatgory
                total += totalCatgory
            }
              )        
        eachState.total = total;
        if (centroidByCountry.get(eachState.key) == undefined) {console.log(centroidByCountry.get(eachState.key))}
         else {eachState.x0 = centroidByCountry.get(eachState.key)[0]
        eachState.x = centroidByCountry.get(eachState.key)[0]
        eachState.y = centroidByCountry.get(eachState.key)[1]
        eachState.y0 = centroidByCountry.get(eachState.key)[1]
      }
        siteByCountry.set(eachState.key, eachState.total);              
      })

      //   eachState.forEach(function(d,) {
      //   d.width = d.value < 50 ? 0 : d.value;
      //   d.height = d.value < 50 ? 0 : d.value;
      //   d.x = i == 0 ? 0 : array[i-1].x + array[i-1].width + SPACING;
      //   d.y = 50;
      // });
       
      
//---------------------------------------------------------------------------------------Draw 

      var partition = d3.layout.partition().size(width, height).children(function (d) 
      {return d.values;}).value(function(d) {return d.total;});
      
      heirarchy = {
        key:'state',
        values:DataSite
      }
      var centerLayout = partition(heirarchy);

      var nodes = svg.selectAll('.countries')
            .data(center, function(d){return d.state});

//-------------------------------------------Represent as a cartogram of populations
        var nodesEnter = nodes.enter()
            .append('g')
            .attr('class','countries');
        
        nodes.exit().remove();

        nodes
            .attr('transform',function(d){ return 'translate('+d.x+','+d.y+')';})
        
        nodes.append('rect')
            .attr('x', function(d){ return 0 }).attr('y', function(d){ return 0 })
                .attr("width", function(d){
                   values = siteByCountry.get(d.state);
                  if (values>=0) {return scaleR(values);} else { return scaleR(0);}
                  })
                   .attr("height", function(d){
                  values = siteByCountry.get(d.state);
                  newValue = scaleR(values);
                  if (values>=0) { return scaleR(values); } else { return scaleR(0); }              
                  })
                .style('fill-opacity',.3);
    
        //TODO: create a force layout
        //with what physical parameters?
        var force = d3.layout.force()
            .size([width,height])
            .charge(-10)
            .gravity(0);


       // console.log("center",center)
        force.nodes(center)
            .on('tick',onForceTick)
            .start();


function onForceTick(e){
    var q = d3.geom.quadtree(center),
        i = 0,
        n = center.length;

    while( ++i<n ){
        q.visit(collide(center[i]));
    }

    nodes
        .each(gravity(e.alpha*.1))
        .attr('transform',function(d){
          // console.log(d)
            return 'translate('+d.x+','+d.y+')';
        })

    function gravity(k){
//---------------------------------------custom gravity: data points gravitate towards a straight line
        return function(d){
            d.y += (d.y0 - d.y)*k;
            d.x += (d.x0 - d.x)*k;
        }
    }

    function collide(dataPoint, state){
      // console.log(dataPoint)
        //var values = siteByCountry.get(d.state)
       // var maxSite = d3.max(DataSite_)

            newValue = scaleR(values)
      console.log("new value ", newValue);

        var nr = dataPoint.newValue + padding,
            nx1 = dataPoint.x - nr,
            ny1 = dataPoint.y - nr,
            nx2 = dataPoint.x + nr,
            ny2 = dataPoint.y + nr;

        return function(quadPoint,x1,y1,x2,y2){
            if(quadPoint.point && (quadPoint.point !== dataPoint)){
                var x = dataPoint.x - quadPoint.point.x,
                    y = dataPoint.y - quadPoint.point.y,
                    l = Math.sqrt(x*x+y*y),
                    r = nr + quadPoint.point.newValue + padding;
                if(l<r){
                    l = (l-r)/l*.1;
                    dataPoint.x -= x*= (l*.05);
                    dataPoint.y -= y*= l;
                    quadPoint.point.x += (x*.05);
                    quadPoint.point.y += y;
                }
            }
            return x1>nx2 || x2<nx1 || y1>ny2 || y2<ny1;
        }
    }
}

});


//------------------------------------------------------------------------parse data
function parseData(d){
          
         

    return { 
      'name':(d["site_name_en"] == " " ? undefined: d["site_name_en"]),
      'category': (d["category"] == " " ? undefined: d["category"]),
      'state': (d["states_name_en"] == " " ? undefined: d["states_name_en"])
  };
}






