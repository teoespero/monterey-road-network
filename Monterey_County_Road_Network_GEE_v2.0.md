# Monterey County Road Network in Google Earth Engine

## Project Overview

This project creates a clean road network map for Monterey County, California using Google Earth Engine (GEE). The goal is to show the roads that are useful at a county and city scale without displaying every road in the county.

The final map separates roads into U.S. highways, state highways, major arterial roads, urban city streets, and optional county roads. A light gray basemap is used so the road colors are easier to see.

## Project Information

- **Project:** Monterey County Road Network
- **Platform:** Google Earth Engine (GEE)
- **Author:** Teo Espero
- **Date Created:** September 7, 2026
- **Current Version:** 2.0

## Main Goals

The project was designed to:

- Display the Monterey County boundary.
- Show U.S. and State highways as separate road classes.
- Show major arterial roads without including every local street.
- Show smaller city streets mainly in developed urban areas.
- Keep rural areas from becoming too crowded with local roads.
- Use a simple color scheme so road types are easy to tell apart.
- Use a light gray basemap so the road network stands out.
- Add a legend directly on the map.

## Data Sources

### TIGER County Boundaries

**Earth Engine dataset:** `TIGER/2018/Counties`

This dataset is used to locate Monterey County and create the county boundary.

Monterey County is selected using:

- `NAME = Monterey`
- `STATEFP = 06`

`06` is the state FIPS code for California.

### TIGER Road Network

**Earth Engine dataset:** `TIGER/2016/Roads`

This dataset contains the road network used in the project.

Important fields include:

- `fullname` — road name
- `rttyp` — route type
- `mtfcc` — road classification
- `linearid` — unique TIGER road identifier

### GHSL Degree of Urbanisation

**Earth Engine dataset:** `JRC/GHSL/P2023A/GHS_SMOD_V2-0/2025`

GHSL is used as an urban mask. It helps decide where smaller city streets should appear.

The urban mask includes settlement classes:

- `21` — suburban or peri-urban
- `22` — semi-dense urban cluster
- `23` — dense urban cluster
- `30` — urban centre

The mask is used behind the scenes and is not displayed on the final map.

## How the Workflow Works

### Load Monterey County

The script starts by loading the TIGER county dataset.

It then filters the national county layer to Monterey County using the county name and California state FIPS code.

The geometry of Monterey County is saved so it can be reused for filtering and clipping later in the script.

### Filter the Road Dataset

The TIGER road dataset covers the entire United States, so the script first reduces it to roads that intersect Monterey County.

The main function used is:

`filterBounds()`

This keeps road features that touch the Monterey County geometry.

Filtering first is important because it prevents the project from trying to work with the entire national road dataset.

## Road Classification

Roads are separated using the `rttyp` and `mtfcc` fields.

### U.S. Highways

U.S. routes are selected using:

`rttyp = U`

These are displayed in red and use the thickest line width.

US 101 is the main example in Monterey County.

### State Highways

State routes are selected using:

`rttyp = S`

These are displayed in orange.

This group can include routes such as Highway 1, Highway 68, and Highway 156.

### Major Arterial Roads

Major roads are selected using:

`mtfcc = S1200`

This classification represents secondary roads and main arteries.

U.S. and State routes are removed from this group because they already have their own layers. This avoids drawing the same road in multiple colors.

Major arterials are displayed in dark blue.

### Urban City Streets

Local and city streets are selected using:

`mtfcc = S1400`

The problem with `S1400` is that it includes many different kinds of roads, including city streets, neighborhood roads, and rural local roads.

Displaying all `S1400` roads across Monterey County makes the map too crowded.

To solve this, the project uses the GHSL urban mask. Local roads are styled first, then the urban mask is applied so these roads mainly appear in developed areas.

This gives a better view of road networks inside places such as Salinas, Marina, Seaside, and Monterey without filling rural areas with thousands of local roads.

### County Roads

County-recognized routes are selected using:

`rttyp = C`

These roads are included as an optional layer and are turned off by default.

This keeps the map cleaner while still allowing additional road detail when needed.

## Filtering and Clipping

Two important operations are used throughout the project.

### `filterBounds()`

`filterBounds()` is used to reduce the road dataset to features that intersect Monterey County.

This means the script does not need to process roads from the rest of the country.

### `.clip()`

After a road layer is styled, `.clip()` is used to keep the displayed result inside the Monterey County boundary.

This is different from filtering.

- `filterBounds()` decides which road features are included.
- `.clip()` controls where the final styled image is visible.

Using both gives a cleaner result.

## Using the Urban Mask

The GHSL settlement image is converted into a simple mask by keeping settlement values of `21` or higher.

The process is:

1. Load the GHSL settlement image.
2. Select the `smod_code` band.
3. Keep values greater than or equal to `21`.
4. Use `selfMask()` so non-urban values become transparent.
5. Clip the mask to Monterey County.
6. Apply the mask to the local road layer with `updateMask()`.

The GHSL mask itself is not added to the map.

This was important because earlier versions showed the mask as gray blocks, which distracted from the road network. In Version 2.0, the mask still controls where city streets appear, but it remains invisible.

## Styling the Road Network

The `.style()` function is used to control how each road class looks.

The current road symbology is:

| Road Type | Color | Hex | Width |
|---|---|---|---:|
| U.S. Highways | Red | `#D7191C` | 5 |
| State Highways | Orange | `#FF8C00` | 4 |
| Major Arterial Roads | Dark Blue | `#1565C0` | 3 |
| Urban City Streets | Light Blue | `#64B5F6` | 1 |
| County Roads | Gold | `#D4A017` | 2 |
| Monterey County Boundary | Dark Gray | `#4D4D4D` | 3 |

The line widths are also part of the visual hierarchy. Larger roads are thicker, while smaller city streets are thinner.

## Layer Order

`Map.addLayer()` is used to place each road layer on the map.

The smaller roads are added first, followed by the larger roads.

The order is:

1. Urban city streets
2. Major arterial roads
3. County roads
4. State highways
5. U.S. highways
6. Monterey County boundary

This makes sure the larger roads remain visible when different road classes overlap.

County roads are added with their default visibility set to `false`, so they are available in the Layers menu but do not automatically appear.

## Light Gray Basemap

A custom light gray basemap is used instead of satellite imagery.

The goal is to reduce visual clutter and make the road colors easier to see.

The custom basemap:

- Uses a light gray land background.
- Uses light blue-gray water.
- Keeps general place labels visible.
- Hides Google's built-in road lines.
- Hides Google's road labels.
- Hides most points of interest.
- Hides transit details.
- Keeps administrative boundaries subtle.

Hiding the built-in roads is important because otherwise the Google basemap roads can make it look like roads are missing from the TIGER layers when they are simply being shown by a different source.

## Map Legend

A custom legend is created using GEE's `ui.Panel` and `ui.Label` tools.

The legend shows:

- U.S. Highways
- State Highways
- Major Arterial Roads
- Urban City Streets
- County Roads

Each legend item uses the same color as its road layer.

The legend is placed in the lower-left corner of the map.

## Console Checks

The script prints several values to the GEE Console for troubleshooting.

These include:

- Total Monterey County road segments
- U.S. highway segment count
- State highway segment count
- Major arterial segment count
- S1400 local road segment count
- County road segment count
- Major arterial road names
- U.S. highway names
- State highway names

These checks are useful because a layer that returns zero features will not display, even if the styling code itself is correct.

## Issues Encountered and Fixes

### Too Many Roads

The first versions displayed too many local roads and made the map difficult to read.

**Fix:** Separate highways and major roads from smaller roads, and avoid displaying every local street county-wide.

### Major City Roads Were Missing

Using only `S1200` did not show enough of the road network inside cities.

**Fix:** Add `S1400` roads for city and local streets.

### Local Streets Created Too Much Clutter

Displaying all `S1400` roads also included rural local roads.

**Fix:** Use GHSL settlement data as an urban mask so smaller roads mainly appear in developed areas.

### TIGER Places Dataset Error

An earlier attempt used `TIGER/2018/Places`, which is not available as an Earth Engine asset under that path.

**Fix:** Remove the dependency on that dataset.

### Empty Geometry Error

An earlier Census-block approach produced an empty urban geometry and caused an `Image.clip` error.

**Fix:** Replace the Census block mask with the GHSL raster urban mask.

### Gray Urban Blocks Appeared on the Map

The GHSL urban mask was temporarily added as a visible map layer, which produced gray blocks over urban areas.

**Fix:** Keep the urban mask only for `updateMask()` and do not add it with `Map.addLayer()`.

## Current Result

The current Version 2.0 produces a county-wide road map with a simple visual hierarchy.

At the county level, highways and arterial roads stand out clearly. When zooming into developed areas, smaller city streets become visible without filling rural portions of Monterey County with unnecessary road detail.

The map also has a cleaner appearance because the basemap does not compete with the road data.

## Limitations

The current project has a few limitations.

### GHSL Is Not a City Boundary

The GHSL mask identifies developed urban areas. It does not represent official incorporated city boundaries.

That means the urban street layer may also include developed areas outside formal city limits.

### TIGER Road Data Is Older

The road network comes from the 2016 TIGER road dataset available in Earth Engine.

Newer streets, renamed roads, or recent road changes may not appear.

### Road Classification Is Generalized

`MTFCC` and `RTTYP` are useful for creating broad road classes, but they do not always match how local agencies classify roads.

A road that is locally considered a major city street may still appear as `S1400` in TIGER.

## Possible Future Improvements

Future versions could include:

- Official incorporated city boundaries.
- City name labels.
- Road labels for major roads only.
- Separate symbology for freeways and other U.S. highways.
- Filtering city streets based on road importance rather than only settlement location.
- Updated road data from a local or state transportation source.
- Exporting the final map for use in reports or GIS software.
- Adding Monterey County cities as separate selectable layers.
- Comparing the TIGER network with OpenStreetMap or local GIS road data.

## Summary

The main workflow is:

**Load → Filter → Classify → Mask → Style → Clip → Display**

The project starts with national Census datasets, filters them to Monterey County, separates roads by classification, uses GHSL to limit smaller streets to developed areas, applies different colors and widths, clips the final layers to the county, and displays them on a custom light gray basemap.

The result is a cleaner road network map that shows enough detail to be useful without turning the county into a wall of road lines.
