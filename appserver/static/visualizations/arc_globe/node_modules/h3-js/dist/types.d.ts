/**
 * @module h3
 */
declare module "h3-js" {
    /**
     * 64-bit hexidecimal string representation of an H3 index
     * @static
     * @typedef {string} H3Index
     */
    type H3Index = string;
    /**
     * Coordinates as an `{i, j}` pair
     * @static
     * @typedef CoordIJ
     * @type {Object}
     * @property {number} i
     * @property {number} j
     */
    type CoordIJ = {
        i: number;
        j: number;
    };
    /**
     * Whether a given string represents a valid H3 index
     * @static
     * @param  {H3Index} h3Index  H3 index to check
     * @return {boolean}          Whether the index is valid
     */
    function h3IsValid(h3Index: H3Index): boolean;
    /**
     * Whether the given H3 index is a pentagon
     * @static
     * @param  {H3Index} h3Index  H3 index to check
     * @return {boolean}          isPentagon
     */
    function h3IsPentagon(h3Index: H3Index): boolean;
    /**
     * Whether the given H3 index is in a Class III resolution (rotated versus
     * the icosahedron and subject to shape distortion adding extra points on
     * icosahedron edges, making them not true hexagons).
     * @static
     * @param  {H3Index} h3Index  H3 index to check
     * @return {boolean}          isResClassIII
     */
    function h3IsResClassIII(h3Index: H3Index): boolean;
    /**
     * Get the number of the base cell for a given H3 index
     * @static
     * @param  {H3Index} h3Index  H3 index to get the base cell for
     * @return {number}           Index of the base cell (0-121)
     */
    function h3GetBaseCell(h3Index: H3Index): number;
    /**
     * Get the indices of all icosahedron faces intersected by a given H3 index
     * @static
     * @param  {H3Index} h3Index  H3 index to get faces for
     * @return {number[]}         Indices (0-19) of all intersected faces
     */
    function h3GetFaces(h3Index: H3Index): number[];
    /**
     * Returns the resolution of an H3 index
     * @static
     * @param  {H3Index} h3Index H3 index to get resolution
     * @return {number}          The number (0-15) resolution, or -1 if invalid
     */
    function h3GetResolution(h3Index: H3Index): number;
    /**
     * Get the hexagon containing a lat,lon point
     * @static
     * @param  {number} lat Latitude of point
     * @param  {number} lng Longtitude of point
     * @param  {number} res Resolution of hexagons to return
     * @return {H3Index}    H3 index
     */
    function geoToH3(lat: number, lng: number, res: number): H3Index;
    /**
     * Get the lat,lon center of a given hexagon
     * @static
     * @param  {H3Index} h3Index  H3 index
     * @return {number[]}         Point as a [lat, lng] pair
     */
    function h3ToGeo(h3Index: H3Index): number[];
    /**
     * Get the vertices of a given hexagon (or pentagon), as an array of [lat, lng]
     * points. For pentagons and hexagons on the edge of an icosahedron face, this
     * function may return up to 10 vertices.
     * @static
     * @param  {H3Index} h3Index          H3 index
     * @param {boolean} [formatAsGeoJson] Whether to provide GeoJSON output: [lng, lat], closed loops
     * @return {number[][]}               Array of [lat, lng] pairs
     */
    function h3ToGeoBoundary(h3Index: H3Index, formatAsGeoJson?: boolean): number[][];
    /**
     * Get the parent of the given hexagon at a particular resolution
     * @static
     * @param  {H3Index} h3Index  H3 index to get parent for
     * @param  {number} res       Resolution of hexagon to return
     * @return {H3Index}          H3 index of parent, or null for invalid input
     */
    function h3ToParent(h3Index: H3Index, res: number): H3Index;
    /**
     * Get the children/descendents of the given hexagon at a particular resolution
     * @static
     * @param  {H3Index} h3Index  H3 index to get children for
     * @param  {number} res       Resolution of hexagons to return
     * @return {H3Index[]}        H3 indexes of children, or empty array for invalid input
     */
    function h3ToChildren(h3Index: H3Index, res: number): H3Index[];
    /**
     * Get the center child of the given hexagon at a particular resolution
     * @static
     * @param  {H3Index} h3Index  H3 index to get center child for
     * @param  {number} res       Resolution of hexagon to return
     * @return {H3Index}          H3 index of child, or null for invalid input
     */
    function h3ToCenterChild(h3Index: H3Index, res: number): H3Index;
    /**
     * Get all hexagons in a k-ring around a given center. The order of the hexagons is undefined.
     * @static
     * @param  {H3Index} h3Index  H3 index of center hexagon
     * @param  {number} ringSize  Radius of k-ring
     * @return {H3Index[]}        H3 indexes for all hexagons in ring
     */
    function kRing(h3Index: H3Index, ringSize: number): H3Index[];
    /**
     * Get all hexagons in a k-ring around a given center, in an array of arrays
     * ordered by distance from the origin. The order of the hexagons within each ring is undefined.
     * @static
     * @param  {H3Index} h3Index  H3 index of center hexagon
     * @param  {number} ringSize  Radius of k-ring
     * @return {H3Index[][]}      Array of arrays with H3 indexes for all hexagons each ring
     */
    function kRingDistances(h3Index: H3Index, ringSize: number): H3Index[][];
    /**
     * Get all hexagons in a hollow hexagonal ring centered at origin with sides of a given length.
     * Unlike kRing, this function will throw an error if there is a pentagon anywhere in the ring.
     * @static
     * @param  {H3Index} h3Index  H3 index of center hexagon
     * @param  {number} ringSize  Radius of ring
     * @return {H3Index[]}        H3 indexes for all hexagons in ring
     * @throws {Error}            If the algorithm could not calculate the ring
     */
    function hexRing(h3Index: H3Index, ringSize: number): H3Index[];
    /**
     * Get all hexagons with centers contained in a given polygon. The polygon
     * is specified with GeoJson semantics as an array of loops. Each loop is
     * an array of [lat, lng] pairs (or [lng, lat] if isGeoJson is specified).
     * The first loop is the perimeter of the polygon, and subsequent loops are
     * expected to be holes.
     * @static
     * @param  {number[][] | number[][][]} coordinates
     *                                  Array of loops, or a single loop
     * @param  {number} res             Resolution of hexagons to return
     * @param  {boolean} [isGeoJson]    Whether to expect GeoJson-style [lng, lat]
     *                                  pairs instead of [lat, lng]
     * @return {H3Index[]}              H3 indexes for all hexagons in polygon
     */
    function polyfill(coordinates: number[][] | number[][][], res: number, isGeoJson?: boolean): H3Index[];
    /**
     * Get the outlines of a set of H3 hexagons, returned in GeoJSON MultiPolygon
     * format (an array of polygons, each with an array of loops, each an array of
     * coordinates). Coordinates are returned as [lat, lng] pairs unless GeoJSON
     * is requested.
     * @static
     * @param {H3Index[]} h3Indexes       H3 indexes to get outlines for
     * @param {boolean} [formatAsGeoJson] Whether to provide GeoJSON output:
     *                                    [lng, lat], closed loops
     * @return {number[][][][]}           MultiPolygon-style output.
     */
    function h3SetToMultiPolygon(h3Indexes: H3Index[], formatAsGeoJson?: boolean): number[][][][];
    /**
     * Compact a set of hexagons of the same resolution into a set of hexagons across
     * multiple levels that represents the same area.
     * @static
     * @param  {H3Index[]} h3Set H3 indexes to compact
     * @return {H3Index[]}       Compacted H3 indexes
     * @throws {Error}           If the input is invalid (e.g. duplicate hexagons)
     */
    function compact(h3Set: H3Index[]): H3Index[];
    /**
     * Uncompact a compacted set of hexagons to hexagons of the same resolution
     * @static
     * @param  {H3Index[]} compactedSet H3 indexes to uncompact
     * @param  {number}    res          The resolution to uncompact to
     * @return {H3Index[]}              The uncompacted H3 indexes
     * @throws {Error}                  If the input is invalid (e.g. invalid resolution)
     */
    function uncompact(compactedSet: H3Index[], res: number): H3Index[];
    /**
     * Whether two H3 indexes are neighbors (share an edge)
     * @static
     * @param  {H3Index} origin      Origin hexagon index
     * @param  {H3Index} destination Destination hexagon index
     * @return {boolean}             Whether the hexagons share an edge
     */
    function h3IndexesAreNeighbors(origin: H3Index, destination: H3Index): boolean;
    /**
     * Get an H3 index representing a unidirectional edge for a given origin and destination
     * @static
     * @param  {H3Index} origin      Origin hexagon index
     * @param  {H3Index} destination Destination hexagon index
     * @return {H3Index}             H3 index of the edge, or null if no edge is shared
     */
    function getH3UnidirectionalEdge(origin: H3Index, destination: H3Index): H3Index;
    /**
     * Get the origin hexagon from an H3 index representing a unidirectional edge
     * @static
     * @param  {H3Index} edgeIndex H3 index of the edge
     * @return {H3Index}           H3 index of the edge origin
     */
    function getOriginH3IndexFromUnidirectionalEdge(edgeIndex: H3Index): H3Index;
    /**
     * Get the destination hexagon from an H3 index representing a unidirectional edge
     * @static
     * @param  {H3Index} edgeIndex H3 index of the edge
     * @return {H3Index}           H3 index of the edge destination
     */
    function getDestinationH3IndexFromUnidirectionalEdge(edgeIndex: H3Index): H3Index;
    /**
     * Whether the input is a valid unidirectional edge
     * @static
     * @param  {H3Index} edgeIndex H3 index of the edge
     * @return {boolean}           Whether the index is valid
     */
    function h3UnidirectionalEdgeIsValid(edgeIndex: H3Index): boolean;
    /**
     * Get the [origin, destination] pair represented by a unidirectional edge
     * @static
     * @param  {H3Index} edgeIndex H3 index of the edge
     * @return {H3Index[]}         [origin, destination] pair as H3 indexes
     */
    function getH3IndexesFromUnidirectionalEdge(edgeIndex: H3Index): H3Index[];
    /**
     * Get all of the unidirectional edges with the given H3 index as the origin (i.e. an edge to
     * every neighbor)
     * @static
     * @param  {H3Index} h3Index   H3 index of the origin hexagon
     * @return {H3Index[]}         List of unidirectional edges
     */
    function getH3UnidirectionalEdgesFromHexagon(h3Index: H3Index): H3Index[];
    /**
     * Get the vertices of a given edge as an array of [lat, lng] points. Note that for edges that
     * cross the edge of an icosahedron face, this may return 3 coordinates.
     * @static
     * @param  {H3Index} edgeIndex        H3 index of the edge
     * @param {boolean} [formatAsGeoJson] Whether to provide GeoJSON output: [lng, lat]
     * @return {number[][]}               Array of geo coordinate pairs
     */
    function getH3UnidirectionalEdgeBoundary(edgeIndex: H3Index, formatAsGeoJson?: boolean): number[][];
    /**
     * Get the grid distance between two hex indexes. This function may fail
     * to find the distance between two indexes if they are very far apart or
     * on opposite sides of a pentagon.
     * @static
     * @param  {H3Index} origin      Origin hexagon index
     * @param  {H3Index} destination Destination hexagon index
     * @return {number}              Distance between hexagons, or a negative
     *                               number if the distance could not be computed
     */
    function h3Distance(origin: H3Index, destination: H3Index): number;
    /**
     * Given two H3 indexes, return the line of indexes between them (inclusive).
     *
     * This function may fail to find the line between two indexes, for
     * example if they are very far apart. It may also fail when finding
     * distances for indexes on opposite sides of a pentagon.
     *
     * Notes:
     *
     *  - The specific output of this function should not be considered stable
     *    across library versions. The only guarantees the library provides are
     *    that the line length will be `h3Distance(start, end) + 1` and that
     *    every index in the line will be a neighbor of the preceding index.
     *  - Lines are drawn in grid space, and may not correspond exactly to either
     *    Cartesian lines or great arcs.
     *
     * @static
     * @param  {H3Index} origin      Origin hexagon index
     * @param  {H3Index} destination Destination hexagon index
     * @return {H3Index[]}           H3 indexes connecting origin and destination
     * @throws {Error}               If the line cannot be calculated
     */
    function h3Line(origin: H3Index, destination: H3Index): H3Index[];
    /**
     * Produces IJ coordinates for an H3 index anchored by an origin.
     *
     * - The coordinate space used by this function may have deleted
     * regions or warping due to pentagonal distortion.
     * - Coordinates are only comparable if they come from the same
     * origin index.
     * - Failure may occur if the index is too far away from the origin
     * or if the index is on the other side of a pentagon.
     * - This function is experimental, and its output is not guaranteed
     * to be compatible across different versions of H3.
     * @static
     * @param  {H3Index} origin      Origin H3 index
     * @param  {H3Index} destination H3 index for which to find relative coordinates
     * @return {CoordIJ}             Coordinates as an `{i, j}` pair
     * @throws {Error}               If the IJ coordinates cannot be calculated
     */
    function experimentalH3ToLocalIj(origin: H3Index, destination: H3Index): CoordIJ;
    /**
     * Produces an H3 index for IJ coordinates anchored by an origin.
     *
     * - The coordinate space used by this function may have deleted
     * regions or warping due to pentagonal distortion.
     * - Coordinates are only comparable if they come from the same
     * origin index.
     * - Failure may occur if the index is too far away from the origin
     * or if the index is on the other side of a pentagon.
     * - This function is experimental, and its output is not guaranteed
     * to be compatible across different versions of H3.
     * @static
     * @param  {H3Index} origin     Origin H3 index
     * @param  {CoordIJ} coords     Coordinates as an `{i, j}` pair
     * @return {H3Index}            H3 index at the relative coordinates
     * @throws {Error}              If the H3 index cannot be calculated
     */
    function experimentalLocalIjToH3(origin: H3Index, coords: CoordIJ): H3Index;
    /**
     * Average hexagon area at a given resolution
     * @static
     * @param  {number} res  Hexagon resolution
     * @param  {string} unit Area unit (either UNITS.m2 or UNITS.km2)
     * @return {number}      Average area
     * @throws {Error}       If the unit is invalid
     */
    function hexArea(res: number, unit: string): number;
    /**
     * Average hexagon edge length at a given resolution
     * @static
     * @param  {number} res  Hexagon resolution
     * @param  {string} unit Area unit (either UNITS.m or UNITS.km)
     * @return {number}      Average edge length
     * @throws {Error}       If the unit is invalid
     */
    function edgeLength(res: number, unit: string): number;
    /**
     * The total count of hexagons in the world at a given resolution. Note that above
     * resolution 8 the exact count cannot be represented in a JavaScript 32-bit number,
     * so consumers should use caution when applying further operations to the output.
     * @static
     * @param  {number} res  Hexagon resolution
     * @return {number}      Count
     */
    function numHexagons(res: number): number;
    /**
     * Get all H3 indexes at resolution 0. As every index at every resolution > 0 is
     * the descendant of a res 0 index, this can be used with h3ToChildren to iterate
     * over H3 indexes at any resolution.
     * @static
     * @return {H3Index[]}  All H3 indexes at res 0
     */
    function getRes0Indexes(): H3Index[];
    /**
     * Get the twelve pentagon indexes at a given resolution.
     * @static
     * @param  {number} res  Hexagon resolution
     * @return {H3Index[]}  All H3 pentagon indexes at res
     */
    function getPentagonIndexes(res: number): H3Index[];
    /**
     * Convert degrees to radians
     * @static
     * @param  {number} deg Value in degrees
     * @return {number}     Value in radians
     */
    function degsToRads(deg: number): number;
    /**
     * Convert radians to degrees
     * @static
     * @param  {number} rad Value in radians
     * @return {number}     Value in degrees
     */
    function radsToDegs(rad: number): number;
}


