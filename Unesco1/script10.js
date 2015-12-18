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

var scaleR = d3.scale.sqrt().range([0,50]).domain([0,47]);
    
var values;

var siteByCountry = d3.map();

var centroidByCountry = d3.map();

var categoryByCountry = d3.map();

//--------------------------------------------------------------------------

queue()
      .defer(d3.json, "data/countries.geo.json")
      .defer(d3.csv, "data/vhc_g_cl.csv", parseData)
      .await(function(err, dataLoaded, DataSite_) {



function dataLoaded (err,data) {
    var nestedData = d3.nest().key(function(d){return d.state})
        .entries(data);

    var hierarchy = {
        key:"category",
        values:nestedData
    };


 d3.selectAll('.btn-default').on('click',function(){
        var id = d3.select(this).attr('id');

        if(id=='all'){
            nodesEnter
                .value(function(d){return d.total})
        }else if(id=="Category"){
            nodesEnter
                .value(function(d){return d.Cultural})
        }else if(id=="Natural"){
            nodesEnter
                .value(function(d){return d.Natural})
        }else if(id=="Mixed"){
            nodesEnter
                .value(function(d){return d.Mixed})
        }

        draw(hierarchy);
    })

    draw(hierarchy);
}


function draw(hierarchy){

var nodes = svg.selectAll('.countries')
            .data(center, function(d){return d.state});


var nodesEnter = nodes.enter()
            .append('g')
            .attr('class','countries');
        
      nodes.exit().remove();

      nodes
            .attr('transform',function(d){ return 'translate('+d.x+','+d.y+')';})
        
      nodes.append('rect')
            .attr('x', function(d){ return 0 }).attr('y', function(d){ return 0 })
                .attr("width", function(d){
                  var values = siteByCountry.get(d.state);
                  if (values>=0) {return scaleR(values);} else { return scaleR(0);}
                  })
                .attr("height", function(d){
                  var values = siteByCountry.get(d.state);
                  if (values>=0) { return scaleR(values); } else { return scaleR(0); }              
                  })
                .style('fill-opacity',.3)
                .on("mousemove", function(d){
               
                    var tooltip = d3.select(".tooltip")
                        .style("visibility","visible")
                    tooltip
                        .select('h2')
                        .html(d.state + " " + d.values)
                        
        });

}

var force = d3.layout.force()
      .size([width,height])
      .charge(-80)
      .gravity(0);

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
        .each(gravity(e.alpha*.5))
        .attr('transform',function(d){
          // console.log(d)
            return 'translate('+d.x+','+d.y+')';
        })

function gravity(k){
        return function(d){
            d.y += (d.y0 - d.y)*k;
            d.x += (d.x0 - d.x)*k;
        }
    }
function collide(dataPoint, DataSite_){

      var values = siteByCountry.get(dataPoint.state);
      if (values>=0) { var nr = (scaleR(values)/Math.sqrt(2))+ padding} else {var nr = scaleR(0)+ padding;}
      dataPoint.r = nr 
        var nx1 = dataPoint.x - nr,
            ny1 = dataPoint.y - nr,
            nx2 = dataPoint.x + nr,
            ny2 = dataPoint.y + nr;

        return function(quadPoint,x1,y1,x2,y2){
            if(quadPoint.point && (quadPoint.point !== dataPoint)){
                var x = dataPoint.x - quadPoint.point.x,
                    y = dataPoint.y - quadPoint.point.y,
                    l = Math.sqrt(x*x+y*y),
                    r = nr + quadPoint.point.r + padding;
                if(l<r){
                    l = (l-r)/l*.1;
                    dataPoint.x -= x*= (l*.05);
                    dataPoint.y -= y*= (l*.05);
                    quadPoint.point.x += (x*.25);
                    quadPoint.point.y += (y*.05);
                }
            }
            return x1>nx2 || x2<nx1 || y1>ny2 || y2<ny1;
        }
    }
}

}

        function parseData(d){ 

    return { 
      'site':(d["site_name_en"] == " " ? undefined: d["site_name_en"]),
      'state': (d["states_name_en"] == " " ? undefined: d["states_name_en"]),
      'category': (d["category"] == " " ? undefined: d["category"]),
      cultural: d.Cultural,
      natural: d.Natural,
      mixed: d.Mixed
    };
}
