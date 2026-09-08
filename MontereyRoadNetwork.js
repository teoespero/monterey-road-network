/***************************************************************
 * PROJECT: Monterey County Road Network
 * PLATFORM: Google Earth Engine (GEE)
 *
 * AUTHOR: Teo Espero
 * DATE CREATED: September 7, 2026
 * VERSION: 2.0
 *
 * PURPOSE:
 * Create a clean transportation map of Monterey County showing:
 *
 *   - U.S. Highways
 *   - State Highways
 *   - Major arterial roads
 *   - Local/city streets in developed urban areas
 *   - County roads as an optional layer
 *   - Monterey County boundary
 *
 * The GHSL urban mask is used only behind the scenes.
 * It is NOT displayed on the map.
 *
 * Because the mask is supposed to help the map,
 * not become the map.
 *
 * DATA SOURCES:
 *   TIGER/2018/Counties
 *   TIGER/2016/Roads
 *   JRC/GHSL/P2023A/GHS_SMOD_V2-0/2025
 *
 * REVISION HISTORY:
 * -------------------------------------------------------------
 * Version   Date          Author       Description
 * -------------------------------------------------------------
 * 1.0       09/07/2026    Teo Espero   Initial road map
 * 1.3       09/07/2026    Teo Espero   Major routes only
 * 1.7       09/07/2026    Teo Espero   Added city streets
 * 1.8       09/07/2026    Teo Espero   Tested Census urban data
 * 1.9       09/07/2026    Teo Espero   Added GHSL urban mask
 * 2.0       09/07/2026    Teo Espero   Hid urban mask from map
 ***************************************************************/


// =============================================================
// LOAD MONTEREY COUNTY
// =============================================================

// Start with every county in the United States.
//
// We only need Monterey County.
// The other 3,000+ counties can wait their turn.
var counties = ee.FeatureCollection(
  'TIGER/2018/Counties'
);


// Select Monterey County, California.
//
// STATEFP 06 = California.
var monterey = counties
  .filter(
    ee.Filter.eq(
      'NAME',
      'Monterey'
    )
  )
  .filter(
    ee.Filter.eq(
      'STATEFP',
      '06'
    )
  )
  .first();


// Save the county geometry.
//
// We use this repeatedly, so giving it a variable is less
// annoying than asking Earth Engine for it every time.
var montereyGeometry = monterey.geometry();


print(
  'Monterey County:',
  monterey
);


// =============================================================
// LOAD TIGER ROADS
// =============================================================

// Load the nationwide Census TIGER road network.
//
// Important fields:
//
// fullname = road name
// rttyp    = route type
// mtfcc    = road classification
// linearid = unique TIGER identifier
var roads = ee.FeatureCollection(
  'TIGER/2016/Roads'
);


// Keep only roads intersecting Monterey County.
//
// Yes, there are a lot.
//
// No, we are still not displaying every residential street
// from the coast to King City.
var montereyRoads = roads.filterBounds(
  montereyGeometry
);


print(
  'Total Monterey County Road Segments:',
  montereyRoads.size()
);


// =============================================================
// U.S. HIGHWAYS
// =============================================================

// RTTYP U = U.S. Route.
//
// US 101 gets the red-carpet treatment.
var usHighways = montereyRoads.filter(
  ee.Filter.eq(
    'rttyp',
    'U'
  )
);


// =============================================================
// STATE HIGHWAYS
// =============================================================

// RTTYP S = State Route.
//
// CA 1, CA 68, CA 156, and whatever else Caltrans
// decided needed a number.
var stateHighways = montereyRoads.filter(
  ee.Filter.eq(
    'rttyp',
    'S'
  )
);


// =============================================================
// MAJOR ARTERIAL ROADS
// =============================================================

// S1200 = secondary road / main arterial.
//
// These are the larger non-freeway roads that help connect
// cities and developed areas.
//
// U.S. and State highways are removed because they already
// have their own layers.
//
// Drawing the same road twice does not make it more accurate.
var majorArterials = montereyRoads

  .filter(
    ee.Filter.eq(
      'mtfcc',
      'S1200'
    )
  )

  .filter(
    ee.Filter.neq(
      'rttyp',
      'U'
    )
  )

  .filter(
    ee.Filter.neq(
      'rttyp',
      'S'
    )
  );


// =============================================================
// LOCAL / CITY STREETS
// =============================================================

// S1400 includes:
//
// - city streets
// - neighborhood roads
// - rural local roads
//
// Showing every S1400 road county-wide would make this
// look like somebody dropped blue spaghetti on Monterey County.
var localRoads = montereyRoads.filter(
  ee.Filter.eq(
    'mtfcc',
    'S1400'
  )
);


// =============================================================
// LOAD GHSL URBANISATION DATA
// =============================================================

// GHSL helps us figure out where developed urban areas are.
//
// We use this ONLY as a mask.
//
// It will NOT be displayed as a layer.
//
// It gets to work quietly behind the scenes like a good
// supporting dataset.
var settlement = ee.Image(
  'JRC/GHSL/P2023A/GHS_SMOD_V2-0/2025'
).select(
  'smod_code'
);


// GHSL settlement classes:
//
// 21 = Suburban / peri-urban
// 22 = Semi-dense urban cluster
// 23 = Dense urban cluster
// 30 = Urban centre
//
// Values 21 and higher work well for identifying developed
// areas where we actually want to see the local street network.
var urbanMask = settlement
  .gte(21)
  .selfMask()
  .clip(
    montereyGeometry
  );


// Notice what is NOT here:
//
// Map.addLayer(urbanMask ...)
//
// That is intentional.
//
// No more giant gray blocks photobombing the road network.


// =============================================================
// COUNTY ROADS
// =============================================================

// RTTYP C = County Route.
//
// Useful if you want additional rural detail.
//
// Off by default because restraint has finally entered
// the project.
var countyRoads = montereyRoads.filter(
  ee.Filter.eq(
    'rttyp',
    'C'
  )
);


// =============================================================
// STYLE URBAN CITY STREETS
// =============================================================

// Draw all S1400 roads first.
//
// Then use the GHSL mask to keep them visible only in
// developed urban areas.
//
// The mask itself remains invisible.
//
// Exactly as nature intended.
var urbanCityRoadStyle = localRoads.style({

  color: '64B5F6',

  width: 1

})
.updateMask(
  urbanMask
)
.clip(
  montereyGeometry
);


// =============================================================
// STYLE MAJOR ARTERIALS
// =============================================================

// Dark blue.
//
// More important than regular city streets,
// less important than highways.
//
// Road hierarchy without unnecessary drama.
var majorArterialStyle = majorArterials.style({

  color: '1565C0',

  width: 3

}).clip(
  montereyGeometry
);


// =============================================================
// STYLE COUNTY ROADS
// =============================================================

// Gold.
//
// Available when needed, quiet when not.
var countyRoadStyle = countyRoads.style({

  color: 'D4A017',

  width: 2

}).clip(
  montereyGeometry
);


// =============================================================
// STYLE STATE HIGHWAYS
// =============================================================

// Orange.
//
// Easy to distinguish from both the blue city network
// and red U.S. highways.
var stateHighwayStyle = stateHighways.style({

  color: 'FF8C00',

  width: 4

}).clip(
  montereyGeometry
);


// =============================================================
// STYLE U.S. HIGHWAYS
// =============================================================

// Red and thick.
//
// US 101 remains convinced this map is about US 101.
var usHighwayStyle = usHighways.style({

  color: 'D7191C',

  width: 5

}).clip(
  montereyGeometry
);


// =============================================================
// STYLE MONTEREY COUNTY BOUNDARY
// =============================================================

// Dark gray outline.
//
// Transparent fill because covering the map with a polygon
// would technically defeat the purpose of making the map.
var countyBoundaryStyle =
  ee.FeatureCollection([monterey]).style({

    color: '4D4D4D',

    fillColor: '00000000',

    width: 3

  });


// =============================================================
// CENTER THE MAP
// =============================================================

// County-wide starting view.
//
// Close enough to understand where things are.
//
// Far enough away that we are not inspecting driveways.
Map.centerObject(
  monterey,
  9
);


// =============================================================
// LIGHT GRAY BASEMAP
// =============================================================

// Keep the basemap quiet.
//
// Our road layers are the subject.
// Google Maps gets a supporting role.
var lightGrayStyle = [

  // General land background.
  {
    elementType: 'geometry',
    stylers: [
      {
        color: '#E8E8E8'
      }
    ]
  },


  // General map labels.
  {
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#606060'
      }
    ]
  },


  // Light halo around labels.
  {
    elementType: 'labels.text.stroke',
    stylers: [
      {
        color: '#F5F5F5'
      }
    ]
  },


  // Hide Google's built-in road geometry.
  //
  // We brought our own road network.
  //
  // No need for Google's version standing behind ours
  // whispering, "but I have roads too."
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },


  // Hide Google's built-in road labels too.
  //
  // A road label without our road underneath it would
  // just create new questions.
  {
    featureType: 'road',
    elementType: 'labels',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },


  // Hide most points of interest.
  //
  // This is a transportation map, not Yelp.
  {
    featureType: 'poi',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },


  // Transit is useful.
  //
  // Just not invited to this particular project.
  {
    featureType: 'transit',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },


  // Light blue-gray water.
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [
      {
        color: '#C6D8E0'
      }
    ]
  },


  // Keep water labels subtle.
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#657A85'
      }
    ]
  },


  // Administrative boundaries stay quiet.
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [
      {
        color: '#B5B5B5'
      }
    ]
  }

];


// Register the custom basemap.
//
// "Light Gray" will appear as a basemap option.
Map.setOptions(
  'Light Gray',
  {
    'Light Gray': lightGrayStyle
  }
);


// =============================================================
// ADD URBAN CITY STREETS
// =============================================================

// Draw smaller streets first.
//
// Bigger roads will be added above them.
Map.addLayer(
  urbanCityRoadStyle,
  {},
  '🩵 Urban City Streets',
  true
);


// =============================================================
// ADD MAJOR ARTERIAL ROADS
// =============================================================

Map.addLayer(
  majorArterialStyle,
  {},
  '🔵 Major Arterial Roads',
  true
);


// =============================================================
// ADD COUNTY ROADS
// =============================================================

// OFF by default.
//
// Turn it on if you want additional county-level detail
// and feel the map has become far too peaceful.
Map.addLayer(
  countyRoadStyle,
  {},
  '🟡 County Roads',
  false
);


// =============================================================
// ADD STATE HIGHWAYS
// =============================================================

Map.addLayer(
  stateHighwayStyle,
  {},
  '🟠 State Highways',
  true
);


// =============================================================
// ADD U.S. HIGHWAYS
// =============================================================

// Added after the other road layers so it remains on top.
Map.addLayer(
  usHighwayStyle,
  {},
  '🔴 U.S. Highways',
  true
);


// =============================================================
// ADD MONTEREY COUNTY BOUNDARY
// =============================================================

// County boundary goes last.
//
// Geography is generally easier when you know where the
// geography ends.
Map.addLayer(
  countyBoundaryStyle,
  {},
  '⚫ Monterey County Boundary',
  true
);


// =============================================================
// CHECK ROAD COUNTS
// =============================================================

// Console checks help us make sure the filters are actually
// returning roads rather than confidently returning nothing.
print(
  'U.S. Highway Segments:',
  usHighways.size()
);


print(
  'State Highway Segments:',
  stateHighways.size()
);


print(
  'Major Arterial Segments:',
  majorArterials.size()
);


print(
  'S1400 Local Road Segments:',
  localRoads.size()
);


print(
  'County Road Segments:',
  countyRoads.size()
);


// =============================================================
// CHECK ROAD NAMES
// =============================================================

// Useful for seeing what TIGER actually considers
// a major arterial.
print(
  'Major Arterial Road Names:',

  majorArterials
    .aggregate_array('fullname')
    .distinct()
    .sort()
);


// U.S. highway names.
print(
  'U.S. Highway Names:',

  usHighways
    .aggregate_array('fullname')
    .distinct()
    .sort()
);


// State highway names.
print(
  'State Highway Names:',

  stateHighways
    .aggregate_array('fullname')
    .distinct()
    .sort()
);


// =============================================================
// BUILD THE LEGEND
// =============================================================

// A colorful map without a legend is just asking people
// to make things up.
var legend = ui.Panel({

  style: {

    position: 'bottom-left',

    padding: '8px 15px',

    backgroundColor: 'FFFFFFEE'

  }

});


// Legend title.
legend.add(

  ui.Label({

    value: 'Monterey County Road Network',

    style: {

      fontWeight: 'bold',

      fontSize: '14px',

      margin: '0 0 8px 0'

    }

  })

);


// =============================================================
// LEGEND HELPER FUNCTION
// =============================================================

// Build the legend row once.
//
// Let the computer handle the repetitive work.
//
// It has fewer complaints.
function addLegendRow(color, labelText) {


  // Colored symbol.
  var colorBox = ui.Label({

    style: {

      backgroundColor: color,

      padding: '8px',

      margin: '0 0 4px 0'

    }

  });


  // Description beside the symbol.
  var description = ui.Label({

    value: labelText,

    style: {

      margin: '0 0 4px 6px'

    }

  });


  // Put symbol and description on the same row.
  var row = ui.Panel({

    widgets: [
      colorBox,
      description
    ],

    layout: ui.Panel.Layout.Flow(
      'horizontal'
    )

  });


  legend.add(
    row
  );

}


// =============================================================
// ADD LEGEND ITEMS
// =============================================================

addLegendRow(
  '#D7191C',
  'U.S. Highways'
);


addLegendRow(
  '#FF8C00',
  'State Highways'
);


addLegendRow(
  '#1565C0',
  'Major Arterial Roads'
);


addLegendRow(
  '#64B5F6',
  'Urban City Streets'
);


addLegendRow(
  '#D4A017',
  'County Roads'
);


// =============================================================
// ADD LEGEND TO MAP
// =============================================================

// Turns out legends are more useful when they actually
// appear on the map.
Map.add(
  legend
);


// =============================================================
// END
// =============================================================

// The GHSL urban mask still decides where local streets appear,
// but the mask itself is completely invisible.
//
// Roads: visible.
// Gray urban blocks: gone.
//
// Much better.