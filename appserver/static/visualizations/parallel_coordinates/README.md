# Parallel Coordinates Visualization

Documentation:
http://docs.splunk.com/Documentation/ParallelCoordinates/1.2.0/ParallelCoordinatesViz/ParallelCoordIntro

## Sample Searches

```
| inputlookup nutrients.csv | head 1500 | table group calories "protein (g)" "water (g)"
```