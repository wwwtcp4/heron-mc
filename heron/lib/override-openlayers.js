/*
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


/**
 * Method: parseLocations
 * Parse the locations from an Atom entry or feed.
 *
 * Parameters:
 * node - {DOMElement} An Atom entry or feed node.
 *
 * Returns:
 * Array({<OpenLayers.Geometry>})
 */
OpenLayers.Format.Atom.prototype.parseLocations = function (node) {
    // NOTE: Just van den Broecke: 8.dec.2012. See
    // Fix for https://github.com/openlayers/openlayers/issues/789
    // on OpenLayers 2.12 (line 105 below)
    var georssns = this.namespaces.georss;

    var locations = {components: []};
    var where = this.getElementsByTagNameNS(node, georssns, "where");
    if (where && where.length > 0) {
        if (!this.gmlParser) {
            this.initGmlParser();
        }
        for (var i = 0, ii = where.length; i < ii; i++) {
            this.gmlParser.readChildNodes(where[i], locations);
        }
    }

    var components = locations.components;
    var point = this.getElementsByTagNameNS(node, georssns, "point");
    if (point && point.length > 0) {
        for (var i = 0, ii = point.length; i < ii; i++) {
            var xy = OpenLayers.String.trim(
                point[i].firstChild.nodeValue
            ).split(/\s+/);
            if (xy.length != 2) {
                xy = OpenLayers.String.trim(
                    point[i].firstChild.nodeValue
                ).split(/\s*,\s*/);
            }
            components.push(new OpenLayers.Geometry.Point(xy[1], xy[0]));
        }
    }

    var line = this.getElementsByTagNameNS(node, georssns, "line");
    if (line && line.length > 0) {
        var coords;
        var p;
        var points;
        for (var i = 0, ii = line.length; i < ii; i++) {
            coords = OpenLayers.String.trim(
                line[i].firstChild.nodeValue
            ).split(/\s+/);
            points = [];
            for (var j = 0, jj = coords.length; j < jj; j += 2) {
                p = new OpenLayers.Geometry.Point(coords[j + 1], coords[j]);
                points.push(p);
            }
            components.push(
                new OpenLayers.Geometry.LineString(points)
            );
        }
    }

    var polygon = this.getElementsByTagNameNS(node, georssns, "polygon");
    if (polygon && polygon.length > 0) {
        var coords;
        var p;
        var points;
        for (var i = 0, ii = polygon.length; i < ii; i++) {
            coords = OpenLayers.String.trim(
                polygon[i].firstChild.nodeValue
            ).split(/\s+/);
            points = [];
            for (var j = 0, jj = coords.length; j < jj; j += 2) {
                p = new OpenLayers.Geometry.Point(coords[j + 1], coords[j]);
                points.push(p);
            }
            components.push(
                new OpenLayers.Geometry.Polygon(
                    [new OpenLayers.Geometry.LinearRing(points)]
                )
            );
        }
    }

    if (this.internalProjection && this.externalProjection) {
        for (var i = 0, ii = components.length; i < ii; i++) {
            if (components[i]) {
                components[i].transform(
                    this.externalProjection,
                    this.internalProjection
                );
            }
        }
    }

    return components;
};


/*OpenLayers.Util.extend(OpenLayers.Format.WFST.v1_1_0.prototype.readers,
 {"gml32": OpenLayers.Format.GML.v3.prototype.readers["gml"]});
 OpenLayers.Format.WFST.v1_0_0.prototype.namespaces.gml32 = 'http://www.opengis.net/gml/3.2';
 */

// do some overrides for OpenLayers to correctly use GetFeatureInfo from the TNO services
// http://trac.osgeo.org/openlayers/ticket/3176 (will be fixed in OL 2.11)

/* --- Fixed in OL 2.11 ---

 OpenLayers.Control.WMSGetFeatureInfo.prototype.buildWMSOptions = function(url, layers, clickPosition, format) {
 var layerNames = [], styleNames = [];
 var i;
 for (i = 0,len = layers.length; i < len; i++) {
 layerNames = layerNames.concat(layers[i].params.LAYERS);
 styleNames = styleNames.concat(this.getStyleNames(layers[i]));
 }
 var firstLayer = layers[0];
 // use the firstLayer's projection if it matches the map projection -
 // this assumes that all layers will be available in this projection
 var projection = this.map.getProjection();
 var layerProj = firstLayer.projection;
 if (layerProj && layerProj.equals(this.map.getProjectionObject())) {
 projection = layerProj.getCode();
 }
 var params = OpenLayers.Util.extend({
 service: "WMS",
 version: firstLayer.params.VERSION,
 request: "GetFeatureInfo",
 layers: layerNames,
 query_layers: layerNames,
 styles: styleNames,
 bbox: this.map.getExtent().toBBOX(null,
 firstLayer.reverseAxisOrder()),
 feature_count: this.maxFeatures,
 height: this.map.getSize().h,
 width: this.map.getSize().w,
 format: format,
 info_format: firstLayer.params.INFO_FORMAT || this.infoFormat
 }, (parseFloat(firstLayer.params.VERSION) >= 1.3) ?
 {
 crs: projection,
 i: parseInt(clickPosition.x, 10),
 j: parseInt(clickPosition.y, 10)
 } :
 {
 srs: projection,
 x: parseInt(clickPosition.x, 10),
 y: parseInt(clickPosition.y, 10)
 }
 );
 OpenLayers.Util.applyDefaults(params, this.vendorParams);
 return {
 url: url,
 params: OpenLayers.Util.upperCaseObject(params),
 callback: function(request) {
 this.handleResponse(clickPosition, request);
 },
 scope: this
 };
 };
 */

// http://trac.osgeo.org/openlayers/ticket/3177 (might be fixed in OL 2.11)

/* --- Fixed in OL 2.11 ---

 OpenLayers.Format.WMSGetFeatureInfo.prototype.read_FeatureInfoResponse = function(data) {
 var response = [];
 var featureNodes = this.getElementsByTagNameNS(data, '*',
 'FIELDS');
 var i;
 var len;
 for (i = 0,len = featureNodes.length; i < len; i++) {
 var featureNode = featureNodes[i];
 var geom = null;

 // attributes can be actual attributes on the FIELDS tag, or FIELD children
 var attributes = {};
 var j;
 var jlen = featureNode.attributes.length;
 if (jlen > 0) {
 for (j = 0; j < jlen; j++) {
 var attribute = featureNode.attributes[j];
 attributes[attribute.nodeName] = attribute.nodeValue;
 }
 } else {
 var nodes = featureNode.childNodes;
 var _featureType = "";
 for (j = 0,jlen = nodes.length; j < jlen; ++j) {
 var node = nodes[j];
 if (node.nodeType !== 3) {
 //Dirty fix for dino name needs to be stripped as it consists of 3 parts
 var dino_name = node.getAttribute("name");
 var _feat = dino_name.split(".");
 if(_feat[0] === "DINO_DBA"){
 attributes[_feat[2]] = node.getAttribute("value");
 _featureType = _feat[1];
 } else {
 attributes[node.getAttribute("name")] = node.getAttribute("value");
 }
 }
 }
 }
 _feature = new OpenLayers.Feature.Vector(geom, attributes, null);

 if(_featureType !== ""){
 // Dirty fix for dino to maintain reference to layer
 _feature.gml = {};
 _feature.gml.featureType = _featureType;
 _feature.fid = _featureType + "." + len;
 _feature.layer = _featureType;
 }
 response.push(_feature);
 }
 return response;
 };
 */

/**
 * Method: read_FeatureInfoResponse
 * Parse FeatureInfoResponse nodes.
 *
 * Parameters:
 * data - {DOMElement}
 *
 * Returns:
 * {Array}
 */
/* OpenLayers.Format.WMSGetFeatureInfo.prototype.read_FeatureInfoResponse = function(data) {
 var response = [];
 var featureNodes = this.getElementsByTagNameNS(data, '*',
 'FIELDS');
 if (featureNodes.length == 0) {
 featureNodes = this.getElementsByTagNameNS(data, '*', 'Field');
 }
 for(var i=0, len=featureNodes.length;i<len;i++) {
 var featureNode = featureNodes[i];
 var geom = null;

 // attributes can be actual attributes on the FIELDS tag,
 // or FIELD children
 var attributes = {};
 var j;
 var jlen = featureNode.attributes.length;
 if (jlen > 0) {
 for(j=0; j<jlen; j++) {
 var attribute = featureNode.attributes[j];
 attributes[attribute.nodeName] = attribute.nodeValue;
 }
 } else {
 var nodes = featureNode.childNodes;
 for (j=0, jlen=nodes.length; j<jlen; ++j) {
 var node = nodes[j];
 if (node.nodeType != 3) {
 attributes[node.getAttribute("name")] =
 node.getAttribute("value");
 }
 }
 }

 response.push(
 new OpenLayers.Feature.Vector(geom, attributes, null)
 );
 }
 return response;
 };
 */
// JvdB 11.05.2011 Taken from OpenLayers 2.10 to fix this issue:
// https://github.com/heron-mc/heron-mc/issues/39

/**
 * Function: modifyDOMElement
 *
 * Modifies many properties of a DOM element all at once.  Passing in
 * null to an individual parameter will avoid setting the attribute.
 *
 * Parameters:
 * id - {String} The element id attribute to set.
 * px - {<OpenLayers.Pixel>} The left and top style position.
 * sz - {<OpenLayers.Size>}  The width and height style attributes.
 * position - {String}       The position attribute.  eg: absolute,
 *                           relative, etc.
 * border - {String}         The style.border attribute.  eg:
 *                           solid black 2px
 * overflow - {String}       The style.overview attribute.
 * opacity - {Float}         Fractional value (0.0 - 1.0)
 */
OpenLayers.Util.modifyDOMElement = function (element, id, px, sz, position,
                                             border, overflow, opacity) {

    if (id) {
        element.id = id;
    }
    if (px) {
        if (!px.x) {
            // JvdB: fix for IE who cannot deal with NaN
            px.x = 0;
        }
        if (!px.y) {
            // JvdB: fix for IE who cannot deal with NaN
            px.y = 0;
        }
        element.style.left = px.x + "px";
        element.style.top = px.y + "px";
    }
    if (sz) {
        element.style.width = sz.w + "px";
        element.style.height = sz.h + "px";
    }
    if (position) {
        element.style.position = position;
    }
    if (border) {
        element.style.border = border;
    }
    if (overflow) {
        element.style.overflow = overflow;
    }
    if (parseFloat(opacity) >= 0.0 && parseFloat(opacity) < 1.0) {
        element.style.filter = 'alpha(opacity=' + (opacity * 100) + ')';
        element.style.opacity = opacity;
    } else if (parseFloat(opacity) == 1.0) {
        element.style.filter = '';
        element.style.opacity = '';
    }
};


/**
 * Donald Kerr's fix to label outlines (Halo's) in IE8
 * http://trac.osgeo.org/openlayers/ticket/2965
 https://github.com/openlayers/openlayers/pull/140
 */
// Later: does not seem to work now...


// https://github.com/heron-mc/heron-mc/issues/185
// Integrate from OL patch.
// http://trac.osgeo.org/openlayers/ticket/3608
// Milestone: 2.13
// setOpacity won't work on a vector layer, if the vector layer is with other vector
// layers in a SelectFeature-Control (the SelectFeature-Control has than a Vect.rootContainer).
// With the following it will work:
// REMOVE/CHECK for OL 2.13 !!
OpenLayers.Layer.Vector.prototype.setOpacity = function (opacity) {
    if (opacity != this.opacity) {
        this.opacity = opacity;
        var element = this.renderer.root;
        OpenLayers.Util.modifyDOMElement(element, null, null, null, null,
            null, null, opacity);
        if (this.map != null) {
            this.map.events.triggerEvent("changelayer", {
                layer: this,
                property: "opacity"
            });
        }
    }
};

// 18.2.14 Solve issues with PrintPreview not cloning all properties for Vector features
// in particular not showing OLE text labels with renderIntent defaultLabel.
// https://github.com/heron-mc/heron-mc/issues/331
/**
 * Method: clone
 * Create a clone of this vector feature.  Does not set any non-standard
 *     properties.
 *
 * Returns:
 * {<OpenLayers.Feature.Vector>} An exact clone of this vector feature.
 */
OpenLayers.Feature.Vector.prototype.clone = function () {
    var clone = new OpenLayers.Feature.Vector(
        this.geometry ? this.geometry.clone() : null,
        this.attributes,
        this.style);

    // JvdB : must clone layer? but later
    // clone.layer = this.layer;
    clone.renderIntent = this.renderIntent;
    return clone;
};

/**
 * Method: clone
 * Create a clone of this layer.
 *
 * Note: Features of the layer are also cloned.
 *
 * Returns:
 * {<OpenLayers.Layer.Vector>} An exact clone of this layer
 */
OpenLayers.Layer.Vector.prototype.clone = function (obj) {

    if (obj == null) {
        obj = new OpenLayers.Layer.Vector(this.name, this.getOptions());
    }

    //get all additions from superclasses
    obj = OpenLayers.Layer.prototype.clone.apply(this, [obj]);

    // Allow for custom layer behavior
    // JvdB: also clone strategies as they have a layer attribute which should be the new layer obj!!
    if (this.strategies) {
        obj.strategies = [];
        for (var i = 0, len = this.strategies.length; i < len; i++) {
            obj.strategies.push(Heron.Utils.createOLObject([this.strategies[i].CLASS_NAME, this.strategies[i]]));
            obj.strategies[i].setLayer(obj);
        }
    }

    // copy/set any non-init, non-simple values here
    var features = this.features;
    var len = features.length;
    var clonedFeatures = new Array(len);
    for (var i = 0; i < len; ++i) {
        clonedFeatures[i] = features[i].clone();

        // JvdB: also copy optional layer attribute
        if (features[i].layer) {
            clonedFeatures[i].layer = obj;
        }
    }
    obj.features = clonedFeatures;

    // JvdB: If a Layer has a StyleMap it is not always cloned properly
    if (this.styleMap && this.styleMap.styles) {
        var clonedStyles = {};
        for (var key in this.styleMap.styles) {
            clonedStyles[key] = this.styleMap.styles[key].clone();
        }
        obj.styleMap = new OpenLayers.StyleMap(clonedStyles);
    }

    return obj;
};

// 11.feb.2016
// See issue https://github.com/heron-mc/heron-mc/issues/399
// Problem is that individual controls may be undefined when
// destroy()-ing the Map's Controls. A check for undefined is required. This patch
// is included here op OL 2.12 (and 2.13). Thanks to https://github.com/dracic !
// See fix: https://github.com/openlayers/ol2/pull/1484/commits
/**
 * APIMethod: destroy
 * Destroy this map.
 *    Note that if you are using an application which removes a container
 *    of the map from the DOM, you need to ensure that you destroy the
 *    map *before* this happens; otherwise, the page unload handler
 *    will fail because the DOM elements that map.destroy() wants
 *    to clean up will be gone. (See
 *    http://trac.osgeo.org/openlayers/ticket/2277 for more information).
 *    This will apply to GeoExt and also to other applications which
 *    modify the DOM of the container of the OpenLayers Map.
 */
OpenLayers.Map.prototype.destroy = function() {
    // if unloadDestroy is null, we've already been destroyed
    if (!this.unloadDestroy) {
        return false;
    }

    // make sure panning doesn't continue after destruction
    if(this.panTween) {
        this.panTween.stop();
        this.panTween = null;
    }

    // map has been destroyed. dont do it again!
    OpenLayers.Event.stopObserving(window, 'unload', this.unloadDestroy);
    this.unloadDestroy = null;

    if (this.updateSizeDestroy) {
        OpenLayers.Event.stopObserving(window, 'resize',
                                       this.updateSizeDestroy);
    } else {
        this.events.unregister("resize", this, this.updateSize);
    }

    this.paddingForPopups = null;

    if (this.controls != null) {
        for (var i = this.controls.length - 1; i>=0; --i) {
            // JvdB: see https://github.com/heron-mc/heron-mc/issues/399
            // Included fix: https://github.com/openlayers/ol2/pull/1484/commits
            if(this.controls[i] != undefined) {
                this.controls[i].destroy();
            }
        }
        this.controls = null;
    }

    if (this.layers != null) {
        for (var i = this.layers.length - 1; i>=0; --i) {
            //pass 'false' to destroy so that map wont try to set a new
            // baselayer after each baselayer is removed
            this.layers[i].destroy(false);
        }
        this.layers = null;
    }
    if (this.viewPortDiv) {
        this.div.removeChild(this.viewPortDiv);
    }
    this.viewPortDiv = null;

    if(this.eventListeners) {
        this.events.un(this.eventListeners);
        this.eventListeners = null;
    }
    this.events.destroy();
    this.events = null;

    this.options = null;
};

/**
 * APIMethod: clone
 * Clones this rule.
 *
 * Returns:
 * {<OpenLayers.Rule>} Clone of this rule.
 */
OpenLayers.Rule.prototype.clone = function () {
    var options = OpenLayers.Util.extend({}, this);
    if (this.symbolizers) {
        // clone symbolizers
        var len = this.symbolizers.length;
        options.symbolizers = new Array(len);
        for (var i = 0; i < len; ++i) {
            options.symbolizers[i] = this.symbolizers[i].clone();
        }
    } else {
        // clone symbolizer
        options.symbolizer = {};
        var value, type;
        for (var key in this.symbolizer) {
            value = this.symbolizer[key];
            type = typeof value;
            if (type === "object") {
                options.symbolizer[key] = OpenLayers.Util.extend({}, value);
                // JvdB: must clone other fields like booleans and reals
                // } else if(type === "string") {
            } else {
                options.symbolizer[key] = value;
            }
        }
    }
    // clone filter
    options.filter = this.filter && this.filter.clone();
    // clone context
    options.context = this.context && OpenLayers.Util.extend({}, this.context);
    return new OpenLayers.Rule(options);
};

// Solve issues with feature selection for features that have individual styles.
/**
 * Method: highlight
 * Redraw feature with the select style.
 *
 * Parameters:
 * feature - {<OpenLayers.Feature.Vector>}
 */
OpenLayers.Control.SelectFeature.prototype.highlight = function (feature) {
    var layer = feature.layer;
    var cont = this.events.triggerEvent("beforefeaturehighlighted", {
        feature: feature
    });
    if (cont !== false) {
        feature._prevHighlighter = feature._lastHighlighter;
        feature._lastHighlighter = this.id;

        // Solve issues with feature selection for features that have individual styles.
        // Use the Layer select style in that case
        if (feature.style && !this.selectStyle && layer.styleMap) {
            var styleMap = layer.styleMap;
            var selectStyle = styleMap.styles['select'];
            if (selectStyle) {
                var defaultStyle = styleMap.styles['default'].clone();
                this.selectStyle = OpenLayers.Util.extend(defaultStyle.defaultStyle, selectStyle.defaultStyle);
            }
        }
        var style = this.selectStyle || this.renderIntent;

        layer.drawFeature(feature, style);
        this.events.triggerEvent("featurehighlighted", {feature: feature});
    }
};


//
// 13.2.2014 - CHANGES for WMSGetFeatureInfo
//
// Version from GitHub (OL 2.12+2.13 are same for these funcs)
// * change: new config param 'requestPerLayer': do not bundle requests for same URL
// * change: allow per-layer vendor params
// Changes indicated on lines with 'JvdB'.
// Changes were required to allow  GFI for WMS "sublayers" based on CQL (or other query lang).
// See example: http://lib.heron-mc.org/heron/latest/examples/sublayers
//
/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */



/**
 * Class: OpenLayers.Control.WMSGetFeatureInfo
 * The WMSGetFeatureInfo control uses a WMS query to get information about a point on the map.  The
 * information may be in a display-friendly format such as HTML, or a machine-friendly format such
 * as GML, depending on the server's capabilities and the client's configuration.  This control
 * handles click or hover events, attempts to parse the results using an OpenLayers.Format, and
 * fires a 'getfeatureinfo' event with the click position, the raw body of the response, and an
 * array of features if it successfully read the response.
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */

/**
 * Method: buildWMSOptions
 * Build an object with the relevant WMS options for the GetFeatureInfo request
 *
 * Parameters:
 * url - {String} The url to be used for sending the request
 * layers - {Array(<OpenLayers.Layer.WMS)} An array of layers
 * clickPosition - {<OpenLayers.Pixel>} The position on the map where the mouse
 *     event occurred.
 * format - {String} The format from the corresponding GetMap request
 */
OpenLayers.Control.WMSGetFeatureInfo.prototype.buildWMSOptions = function (url, layers, clickPosition, format) {
    var layerNames = [], styleNames = [];
    var time;
    for (var i = 0, len = layers.length; i < len; i++) {
        if (layers[i].params.LAYERS != null) {
            layerNames = layerNames.concat(layers[i].params.LAYERS);
            styleNames = styleNames.concat(this.getStyleNames(layers[i]));
        }
        if (layers[i].params.TIME != null) {
            this.vendorParams.time = layers[i].params.TIME;
        }
    }
    var firstLayer = layers[0];
    // use the firstLayer's projection if it matches the map projection -
    // this assumes that all layers will be available in this projection
    var projection = this.map.getProjection();
    var layerProj = firstLayer.projection;
    if (layerProj && layerProj.equals(this.map.getProjectionObject())) {
        projection = layerProj.getCode();
    }
    var params = OpenLayers.Util.extend({
            service: "WMS",
            version: firstLayer.params.VERSION,
            request: "GetFeatureInfo",
            exceptions: firstLayer.params.EXCEPTIONS,
            bbox: this.map.getExtent().toBBOX(null,
                firstLayer.reverseAxisOrder()),
            feature_count: this.maxFeatures,
            height: this.map.getSize().h,
            width: this.map.getSize().w,
            format: format,
            info_format: firstLayer.params.INFO_FORMAT || this.infoFormat
        }, (parseFloat(firstLayer.params.VERSION) >= 1.3) ?
        {
            crs: projection,
            i: parseInt(clickPosition.x),
            j: parseInt(clickPosition.y)
        } :
        {
            srs: projection,
            x: parseInt(clickPosition.x),
            y: parseInt(clickPosition.y)
        }
    );
    if (layerNames.length != 0) {
        params = OpenLayers.Util.extend({
            layers: layerNames,
            query_layers: layerNames,
            styles: styleNames
        }, params);
    }

    // JvdB : Apply per-layer vendor params like CQL if present
    OpenLayers.Util.applyDefaults(params, firstLayer.params.vendorParams);

    OpenLayers.Util.applyDefaults(params, this.vendorParams);
    return {
        url: url,
        params: OpenLayers.Util.upperCaseObject(params),
        callback: function (request) {
            this.handleResponse(clickPosition, request, url);
        },
        scope: this
    };
};

/**
 * Method: request
 * Sends a GetFeatureInfo request to the WMS
 *
 * Parameters:
 * clickPosition - {<OpenLayers.Pixel>} The position on the map where the
 *     mouse event occurred.
 * options - {Object} additional options for this method.
 *
 * Valid options:
 * - *hover* {Boolean} true if we do the request for the hover handler
 */
OpenLayers.Control.WMSGetFeatureInfo.prototype.request = function (clickPosition, options) {
    var layers = this.findLayers();
    if (layers.length == 0) {
        this.events.triggerEvent("nogetfeatureinfo");
        // Reset the cursor.
        OpenLayers.Element.removeClass(this.map.viewPortDiv, "olCursorWait");
        return;
    }

    options = options || {};
    if (this.drillDown === false) {
        var wmsOptions = this.buildWMSOptions(this.url, layers,
            clickPosition, layers[0].params.FORMAT);
        var request = OpenLayers.Request.GET(wmsOptions);

        if (options.hover === true) {
            this.hoverRequest = request;
        }
    } else {
        this._requestCount = 0;
        this._numRequests = 0;
        this.features = [];
        // group according to service url to combine requests
        var services = {}, url;
        for (var i = 0, len = layers.length; i < len; i++) {
            var layer = layers[i];
            var service, found = false;
            url = OpenLayers.Util.isArray(layer.url) ? layer.url[0] : layer.url;
            if (url in services) {
                services[url].push(layer);
            } else {
                this._numRequests++;
                services[url] = [layer];
            }
        }
        var layers;
        for (var url in services) {
            layers = services[url];
            // JvdB: in some sames the client does not want to bundle requests
            // for multiple Layers from same server, e.g. with CQL-based requests
            // the responses need to be tied to the CQL sublayer.
            if (this.requestPerLayer) {
                for (var l = 0, len = layers.length; l < len; l++) {
                    var wmsOptions = this.buildWMSOptions(url, [layers[l]],
                        clickPosition, layers[0].params.FORMAT);
                    var req = OpenLayers.Request.GET(wmsOptions);

                    // Tie the Layer to the request as we can determine
                    // to which Layer a response belongs
                    req.layer = layers[l];
                }
                // Increment request-count as we had 1 req per url above
                this._numRequests += layers.length - 1;
            } else {
                var wmsOptions = this.buildWMSOptions(url, layers,
                    clickPosition, layers[0].params.FORMAT);
                OpenLayers.Request.GET(wmsOptions);
            }
        }
    }
};


/**
 * Method: handleResponse
 * Handler for the GetFeatureInfo response.
 *
 * Parameters:
 * xy - {<OpenLayers.Pixel>} The position on the map where the
 *     mouse event occurred.
 * request - {XMLHttpRequest} The request object.
 * url - {String} The url which was used for this request.
 */
OpenLayers.Control.WMSGetFeatureInfo.prototype.handleResponse = function (xy, request, url) {

    var doc = request.responseXML;
    if (!doc || !doc.documentElement) {
        doc = request.responseText;
    }
    var features = this.format.read(doc);

    // JvdB remember the Layer e.g. to discern Layer subsets (via CQL)
    if (request.layer && features) {
        for (var f = 0; f < features.length; f++) {
            features[f].layer = request.layer;
        }
    }
    if (this.drillDown === false) {
        this.triggerGetFeatureInfo(request, xy, features);
    } else {
        this._requestCount++;
        if (this.output === "object") {
            this._features = (this._features || []).concat(
                {url: url, features: features}
            );
        } else {
            this._features = (this._features || []).concat(features);
        }
        if (this._requestCount === this._numRequests) {
            this.triggerGetFeatureInfo(request, xy, this._features.concat());
            delete this._features;
            delete this._requestCount;
            delete this._numRequests;
        }
    }
};


// Added 11.8.2014 - JvdB
// Solve Capabilities parsing issues in IE: XML DOM uses  validation by default, i.e.
// fetching DTDs. In many cases the validation fails (even if the document is vald it seems).
// https://github.com/heron-mc/heron-mc/issues/324
// Also not fixed in OL 2.13!
// See https://github.com/openlayers/openlayers/issues/1379
// We need the same implementation as OL XMLHttpRequest.js
//            oDocument    = new window.ActiveXObject("Microsoft.XMLDOM");
//            oDocument.async                = false;
//            oDocument.validateOnParse    = false;
//            oDocument.loadXML(sResponse);

/**
 * APIMethod: read
 * Deserialize a XML string and return a DOM node.
 *
 * Parameters:
 * text - {String} A XML string

 * Returns:
 * {DOMElement} A DOM node
 */
OpenLayers.Format.XML.prototype.read = function (text) {

    var index = text.indexOf('<');
    if (index > 0) {
        text = text.substring(index);
    }
    var node = OpenLayers.Util.Try(
        OpenLayers.Function.bind((
            function () {
                var xmldom;
                /**
                 * Since we want to be able to call this method on the prototype
                 * itself, this.xmldom may not exist even if in IE.
                 */
                if (window.ActiveXObject && !this.xmldom) {
                    xmldom = new ActiveXObject("Microsoft.XMLDOM");
                } else {
                    xmldom = this.xmldom;

                }
                xmldom.validateOnParse = false;
                xmldom.loadXML(text);
                return xmldom;
            }
        ), this),
        function () {
            return new DOMParser().parseFromString(text, 'text/xml');
        },
        function () {
            var req = new XMLHttpRequest();
            req.open("GET", "data:" + "text/xml" +
            ";charset=utf-8," + encodeURIComponent(text), false);
            if (req.overrideMimeType) {
                req.overrideMimeType("text/xml");
            }
            req.send(null);
            return req.responseXML;
        }
    );

    if (this.keepData) {
        this.data = node;
    }

    return node;
};

// TMSCapabilities: needed for GXP plugin gxp_tmssource
// Remove when upgrading to OL 2.13

/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**

 */

/**
 * Class: OpenLayers.Format.TMSCapabilities
 * Parse TMS Capabilities.
 * See http://wiki.osgeo.org/wiki/Tile_Map_Service_Specification
 *
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.TMSCapabilities = OpenLayers.Class(
    OpenLayers.Format.XML, {

        /**
         * Property: defaultPrefix
         */
        defaultPrefix: "tms",

        /**
         * Property: readers
         * Contains public functions, grouped by namespace prefix, that will
         *     be applied when a namespaced node is found matching the function
         *     name.  The function will be applied in the scope of this parser
         *     with two arguments: the node being read and a context object passed
         *     from the parent.
         */
        readers: {
            "tms": {
                "Services": function (node, obj) {
                    obj.services = [];
                    this.readChildNodes(node, obj);
                },
                "TileMapService": function (node, obj) {
                    if (obj.services) {
                        obj.services.push({
                            service: 'TMS',
                            version: node.getAttribute("version"),
                            title: node.getAttribute("title"),
                            href: node.getAttribute("href")
                        });
                    } else {
                        this.readChildNodes(node, obj);
                    }
                },
                "TileMaps": function (node, obj) {
                    obj.tileMaps = [];
                    this.readChildNodes(node, obj);
                },
                "TileMap": function (node, obj) {
                    if (obj.tileMaps) {
                        obj.tileMaps.push({
                            href: node.getAttribute("href"),
                            srs: node.getAttribute("srs"),
                            title: node.getAttribute("title"),
                            profile: node.getAttribute("profile")
                        });
                    } else {
                        obj.version = node.getAttribute("version");
                        obj.tileMapService = node.getAttribute("tilemapservice");
                        this.readChildNodes(node, obj);
                    }
                },
                "Title": function (node, obj) {
                    obj.title = this.getChildValue(node);
                },
                "Abstract": function (node, obj) {
                    obj['abstract'] = this.getChildValue(node);
                },
                "SRS": function (node, obj) {
                    obj.srs = this.getChildValue(node);
                },
                "BoundingBox": function (node, obj) {
                    obj.bbox = new OpenLayers.Bounds(
                        node.getAttribute("minx"),
                        node.getAttribute("miny"),
                        node.getAttribute("maxx"),
                        node.getAttribute("maxy"));
                },
                "Origin": function (node, obj) {
                    obj.origin = new OpenLayers.LonLat(
                        node.getAttribute("x"),
                        node.getAttribute("y"));
                },
                "TileFormat": function (node, obj) {
                    obj.tileFormat = {
                        width: parseInt(node.getAttribute("width"), 10),
                        height: parseInt(node.getAttribute("height"), 10),
                        mimeType: node.getAttribute("mime-type"),
                        extension: node.getAttribute("extension")
                    };
                },
                "TileSets": function (node, obj) {
                    obj.tileSets = [];
                    this.readChildNodes(node, obj);
                },
                "TileSet": function (node, obj) {
                    obj.tileSets.push({
                        href: node.getAttribute("href"),
                        unitsPerPixel: parseFloat(node.getAttribute("units-per-pixel")),
                        order: parseInt(node.getAttribute("order"), 10)
                    });
                },
                "TileMapServerError": function (node, obj) {
                    obj.error = true;
                },
                "Message": function (node, obj) {
                    obj.message = this.getChildValue(node);
                }
            }
        },

        /**
         * APIMethod: read
         * Read TMS capabilities data from a string, and return a list of tilesets.
         *
         * Parameters:
         * data - {String} or {DOMElement} data to read/parse.
         *
         * Returns:
         * {Object} Information about the services served by this TMS instance.
         */
        read: function (data) {
            if (typeof data == "string") {
                data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
            }
            var raw = data;
            if (data && data.nodeType == 9) {
                data = data.documentElement;
            }
            var capabilities = {};
            this.readNode(data, capabilities);
            return capabilities;
        },

        CLASS_NAME: "OpenLayers.Format.TMSCapabilities"

    });


// 15.4.2014 - read() method in OpenLayers.Protocol.CSW.v2_0_2
// Problem: the filters are not expanded in the request
// taken from GXP version

/**
 * Method: read
 * Construct a request for reading new records from the Catalogue.
 */
OpenLayers.Protocol.CSW.v2_0_2.prototype.read = function (options) {
    options = OpenLayers.Util.extend({}, options);
    OpenLayers.Util.applyDefaults(options, this.options || {});
    var response = new OpenLayers.Protocol.Response({requestType: "read"});

    // JvdB : this line differs with OL 2.12 !!
    var data = this.format.write(options.params || options);

    response.priv = OpenLayers.Request.POST({
        url: options.url,
        callback: this.createCallback(this.handleRead, response, options),
        params: options.params,
        headers: options.headers,
        data: data
    });

    return response;
};

/**
 * START Heron issue 378 (Namespaces IE11):
 * https://github.com/heron-mc/heron-mc/issues/378
 * bug with IE11: an extra NS1 namespace is inserted in the WFS-request XML.
 * This extra namespace is not valid and causes an error on execution.
 * If multiple operations are send in a single operation namespaces NS2, NS3 and so on, are
 * generated by IE11. The fixes below (by Bart vd E) take care of this.
 *
 * Fixed in OpenLayers (due v 2.14):
 * https://github.com/openlayers/openlayers/commit/821975c1f500e26c6663584356db5d65b57f70d9
 * Fix for three protocols: SOS, CSW and WFS (3 versions)
 */

/** CSW **/

/*
 * Overriding OpenLayers to add xmlns NS
 *
 */
OpenLayers.Util.extend(OpenLayers.Format.CSWGetRecords.v2_0_2.prototype.namespaces,
    {
        xmlns: "http://www.w3.org/2000/xmlns/"
    });


/**
 * Method: write
 * Given an configuration js object, write a CSWGetRecords request.
 *
 * Parameters:
 * options - {Object} A object mapping the request.
 *
 * Returns:
 * {String} A serialized CSWGetRecords request.
 */
OpenLayers.Format.CSWGetRecords.v2_0_2.prototype.write = function (options) {
    var node = this.writeNode("csw:GetRecords", options);
    this.setAttributeNS(
        node, this.namespaces.xmlns,
        "xmlns:gmd", this.namespaces.gmd
    );
    return OpenLayers.Format.XML.prototype.write.apply(this, [node]);
};

/** SOS **/

/*
 * Overriding OpenLayers to add xmlns NS
 *
 */
OpenLayers.Util.extend(OpenLayers.Format.SOSGetObservation.prototype.namespaces,
    {
        xmlns: "http://www.w3.org/2000/xmlns/"
    });

/**
 * Method: write
 * Given an configuration js object, write a CSWGetRecords request.
 *
 * Parameters:
 * options - {Object} A object mapping the request.
 *
 * Returns:
 * {String} A serialized CSWGetRecords request.
 */
OpenLayers.Format.SOSGetObservation.prototype.write = function (options) {
    var node = this.writeNode("sos:GetObservation", options);
    this.setAttributeNS(
        node, this.namespaces.xmlns,
        "xmlns:om", this.namespaces.om
    );
    this.setAttributeNS(
        node, this.namespaces.xmlns,
        "xmlns:ogc", this.namespaces.ogc
    );
    this.setAttributeNS(
        node, this.namespaces.xsi,
        "xsi:schemaLocation", this.schemaLocation
    );
    return OpenLayers.Format.XML.prototype.write.apply(this, [node]);
};

/** WFS v1 **/

/*
 * Overriding OpenLayers to add xmlns NS (needed once for all WFS formatters)
 * Overiding OpenLayers to add support for GML 3.2.1
 *
 */
OpenLayers.Util.extend(OpenLayers.Format.WFST.v1.prototype.namespaces,
    {
        xmlns: "http://www.w3.org/2000/xmlns/",
        gml32: "http://www.opengis.net/gml/3.2"
    });

/**
 * Property: writers
 * As a compliment to the readers property, this structure contains public
 *     writing functions grouped by namespace alias and named like the
 *     node names they produce.
 */
OpenLayers.Format.WFST.v1.prototype.writers =
{
    "wfs": {
        "GetFeature": function (options) {
            var node = this.createElementNSPlus("wfs:GetFeature", {
                attributes: {
                    service: "WFS",
                    version: this.version,
                    handle: options && options.handle,
                    outputFormat: options && options.outputFormat,
                    maxFeatures: options && options.maxFeatures,
                    "xsi:schemaLocation": this.schemaLocationAttr(options)
                }
            });
            if (typeof this.featureType == "string") {
                this.writeNode("Query", options, node);
            } else {
                for (var i = 0, len = this.featureType.length; i < len; i++) {
                    options.featureType = this.featureType[i];
                    this.writeNode("Query", options, node);
                }
            }
            return node;
        },
        "Transaction": function (obj) {
            obj = obj || {};
            var options = obj.options || {};
            var node = this.createElementNSPlus("wfs:Transaction", {
                attributes: {
                    service: "WFS",
                    version: this.version,
                    handle: options.handle
                }
            });
            var i, len;
            var features = obj.features;
            if (features) {
                // temporarily re-assigning geometry types
                if (options.multi === true) {
                    OpenLayers.Util.extend(this.geometryTypes, {
                        "OpenLayers.Geometry.Point": "MultiPoint",
                        "OpenLayers.Geometry.LineString": (this.multiCurve === true) ? "MultiCurve" : "MultiLineString",
                        "OpenLayers.Geometry.Polygon": (this.multiSurface === true) ? "MultiSurface" : "MultiPolygon"
                    });
                }
                var name, feature;
                for (i = 0, len = features.length; i < len; ++i) {
                    feature = features[i];
                    name = this.stateName[feature.state];
                    if (name) {
                        this.writeNode(name, {
                            feature: feature,
                            options: options
                        }, node);
                    }
                }
                // switch back to original geometry types assignment
                if (options.multi === true) {
                    this.setGeometryTypes();
                }
            }
            if (options.nativeElements) {
                for (i = 0, len = options.nativeElements.length; i < len; ++i) {
                    this.writeNode("wfs:Native",
                        options.nativeElements[i], node);
                }
            }
            return node;
        },
        "Native": function (nativeElement) {
            var node = this.createElementNSPlus("wfs:Native", {
                attributes: {
                    vendorId: nativeElement.vendorId,
                    safeToIgnore: nativeElement.safeToIgnore
                },
                value: nativeElement.value
            });
            return node;
        },
        "Insert": function (obj) {
            var feature = obj.feature;
            var options = obj.options;
            var node = this.createElementNSPlus("wfs:Insert", {
                attributes: {
                    handle: options && options.handle
                }
            });
            this.srsName = this.getSrsName(feature);
            this.writeNode("feature:_typeName", feature, node);
            return node;
        },
        "Update": function (obj) {
            var feature = obj.feature;
            var options = obj.options;
            var node = this.createElementNSPlus("wfs:Update", {
                attributes: {
                    handle: options && options.handle,
                    typeName: (this.featureNS ? this.featurePrefix + ":" : "") +
                    this.featureType
                }
            });
            if (this.featureNS) {
                this.setAttributeNS(
                    node, this.namespaces.xmlns,
                    "xmlns:" + this.featurePrefix, this.featureNS
                );
            }

            // add in geometry
            var modified = feature.modified;
            if (this.geometryName !== null && (!modified || modified.geometry !== undefined)) {
                this.srsName = this.getSrsName(feature);
                this.writeNode(
                    "Property", {name: this.geometryName, value: feature.geometry}, node
                );
            }

            // add in attributes
            for (var key in feature.attributes) {
                if (feature.attributes[key] !== undefined &&
                    (!modified || !modified.attributes ||
                    (modified.attributes && (key in modified.attributes)))) {
                    this.writeNode(
                        "Property", {name: key, value: feature.attributes[key]}, node
                    );
                }
            }

            // add feature id filter
            this.writeNode("ogc:Filter", new OpenLayers.Filter.FeatureId({
                fids: [feature.fid]
            }), node);

            return node;
        },
        "Property": function (obj) {
            var node = this.createElementNSPlus("wfs:Property");
            this.writeNode("Name", obj.name, node);
            if (obj.value !== null) {
                this.writeNode("Value", obj.value, node);
            }
            return node;
        },
        "Name": function (name) {
            return this.createElementNSPlus("wfs:Name", {value: name});
        },
        "Value": function (obj) {
            var node;
            if (obj instanceof OpenLayers.Geometry) {
                node = this.createElementNSPlus("wfs:Value");
                var geom = this.writeNode("feature:_geometry", obj).firstChild;
                node.appendChild(geom);
            } else {
                node = this.createElementNSPlus("wfs:Value", {value: obj});
            }
            return node;
        },
        "Delete": function (obj) {
            var feature = obj.feature;
            var options = obj.options;
            var node = this.createElementNSPlus("wfs:Delete", {
                attributes: {
                    handle: options && options.handle,
                    typeName: (this.featureNS ? this.featurePrefix + ":" : "") +
                    this.featureType
                }
            });
            if (this.featureNS) {
                this.setAttributeNS(
                    node, this.namespaces.xmlns,
                    "xmlns:" + this.featurePrefix, this.featureNS
                );
            }
            this.writeNode("ogc:Filter", new OpenLayers.Filter.FeatureId({
                fids: [feature.fid]
            }), node);
            return node;
        }
    }
};

/** WFS v1.0.0 **/


/**
 * Property: writers
 * As a compliment to the readers property, this structure contains public
 *     writing functions grouped by namespace alias and named like the
 *     node names they produce.
 */
OpenLayers.Format.WFST.v1_0_0.prototype.writers = {
    "wfs": OpenLayers.Util.applyDefaults({
        "Query": function (options) {
            options = OpenLayers.Util.extend({
                featureNS: this.featureNS,
                featurePrefix: this.featurePrefix,
                featureType: this.featureType,
                srsName: this.srsName,
                srsNameInQuery: this.srsNameInQuery
            }, options);
            var prefix = options.featurePrefix;
            var node = this.createElementNSPlus("wfs:Query", {
                attributes: {
                    typeName: (prefix ? prefix + ":" : "") +
                    options.featureType
                }
            });
            if (options.srsNameInQuery && options.srsName) {
                node.setAttribute("srsName", options.srsName);
            }
            if (options.featureNS) {
                this.setAttributeNS(
                    node, this.namespaces.xmlns,
                    "xmlns:" + prefix, options.featureNS
                );
            }
            if (options.propertyNames) {
                for (var i = 0, len = options.propertyNames.length; i < len; i++) {
                    this.writeNode(
                        "ogc:PropertyName",
                        {property: options.propertyNames[i]},
                        node
                    );
                }
            }
            if (options.filter) {
                this.setFilterProperty(options.filter);
                this.writeNode("ogc:Filter", options.filter, node);
            }
            return node;
        }
    }, OpenLayers.Format.WFST.v1.prototype.writers["wfs"]),
    "gml": OpenLayers.Format.GML.v2.prototype.writers["gml"],
    "feature": OpenLayers.Format.GML.v2.prototype.writers["feature"],
    "ogc": OpenLayers.Format.Filter.v1_0_0.prototype.writers["ogc"]
};

/** WFS v1.1.0 **/

/* NS already added in v1. */

/**
 * Property: writers
 * As a compliment to the readers property, this structure contains public
 *     writing functions grouped by namespace alias and named like the
 *     node names they produce.
 */
OpenLayers.Format.WFST.v1_1_0.prototype.writers = {
    "wfs": OpenLayers.Util.applyDefaults({
        "GetFeature": function (options) {
            var node = OpenLayers.Format.WFST.v1.prototype.writers["wfs"]["GetFeature"].apply(this, arguments);
            options && this.setAttributes(node, {
                resultType: options.resultType,
                startIndex: options.startIndex,
                count: options.count
            });
            return node;
        },
        "Query": function (options) {
            options = OpenLayers.Util.extend({
                featureNS: this.featureNS,
                featurePrefix: this.featurePrefix,
                featureType: this.featureType,
                srsName: this.srsName
            }, options);
            var prefix = options.featurePrefix;
            var node = this.createElementNSPlus("wfs:Query", {
                attributes: {
                    typeName: (prefix ? prefix + ":" : "") +
                    options.featureType,
                    srsName: options.srsName
                }
            });
            if (options.featureNS) {
                this.setAttributeNS(node, this.namespaces.xmlns,
                    "xmlns:" + prefix, options.featureNS);
            }
            if (options.propertyNames) {
                for (var i = 0, len = options.propertyNames.length; i < len; i++) {
                    this.writeNode(
                        "wfs:PropertyName",
                        {property: options.propertyNames[i]},
                        node
                    );
                }
            }
            if (options.filter) {
                OpenLayers.Format.WFST.v1_1_0.prototype.setFilterProperty.call(this, options.filter);
                this.writeNode("ogc:Filter", options.filter, node);
            }
            return node;
        },
        "PropertyName": function (obj) {
            return this.createElementNSPlus("wfs:PropertyName", {
                value: obj.property
            });
        }
    }, OpenLayers.Format.WFST.v1.prototype.writers["wfs"]),
    "gml": OpenLayers.Format.GML.v3.prototype.writers["gml"],
    "feature": OpenLayers.Format.GML.v3.prototype.writers["feature"],
    "ogc": OpenLayers.Format.Filter.v1_1_0.prototype.writers["ogc"]
};

/** END fix for issue 378 (Namespaces IE11) */

// -------------------------------------------
// Fix issue 383: OLeditor - GPX export/import
// -------------------------------------------
// Code from OL 2.12 - GPX.js
// -------------------------------------------
//
// !!! NOTE: Wolfram Winter - 20124-07-29
// !!! This code fix must be removed, if using OL >= 2.13
//
// See:
// https://github.com/openlayers/openlayers/blob/master/notes/2.13.md#formatgpx-no-more-prefixes
//
// No 'gpx:' prefix is added in the XML tags anymore when writing
// GPX from OpenLayers features. It seems like it is not supported
// by most of the tools that are able to read GPX.
// -------------------------------------------
OpenLayers.Format.GPX.prototype.buildMetadataNode = function (metadata) {
    var types = ['name', 'desc', 'author'],
        node = this.createElementNS(this.namespaces.gpx, 'metadata');
    for (var i = 0; i < types.length; i++) {
        var type = types[i];
        if (metadata[type]) {
            var n = this.createElementNS(this.namespaces.gpx, type);
            n.appendChild(this.createTextNode(metadata[type]));
            node.appendChild(n);
        }
    }
    return node;
};

OpenLayers.Format.GPX.prototype.buildFeatureNode = function (feature) {
    var geometry = feature.geometry;
    geometry = geometry.clone();
    if (this.internalProjection && this.externalProjection) {
        geometry.transform(this.internalProjection,
            this.externalProjection);
    }
    if (geometry.CLASS_NAME == "OpenLayers.Geometry.Point") {
        var wpt = this.buildWptNode(geometry);
        this.appendAttributesNode(wpt, feature);
        return wpt;
    } else {
        var trkNode = this.createElementNS(this.namespaces.gpx, "trk");

        this.appendAttributesNode(trkNode, feature);
        var trkSegNodes = this.buildTrkSegNode(geometry);
        trkSegNodes = OpenLayers.Util.isArray(trkSegNodes) ?
            trkSegNodes : [trkSegNodes];
        for (var i = 0, len = trkSegNodes.length; i < len; i++) {
            trkNode.appendChild(trkSegNodes[i]);
        }
        return trkNode;
    }
};

OpenLayers.Format.GPX.prototype.buildTrkSegNode = function (geometry) {
    var node,
        i,
        len,
        point,
        nodes;
    if (geometry.CLASS_NAME == "OpenLayers.Geometry.LineString" ||
        geometry.CLASS_NAME == "OpenLayers.Geometry.LinearRing") {
        node = this.createElementNS(this.namespaces.gpx, "trkseg");
        for (i = 0, len = geometry.components.length; i < len; i++) {
            point = geometry.components[i];
            node.appendChild(this.buildTrkPtNode(point));
        }
        return node;
    } else {
        nodes = [];
        for (i = 0, len = geometry.components.length; i < len; i++) {
            nodes.push(this.buildTrkSegNode(geometry.components[i]));
        }
        return nodes;
    }
};

OpenLayers.Format.GPX.prototype.buildTrkPtNode = function (point) {
    var node = this.createElementNS(this.namespaces.gpx, "trkpt");
    node.setAttribute("lon", point.x);
    node.setAttribute("lat", point.y);
    return node;
};

OpenLayers.Format.GPX.prototype.buildWptNode = function (geometry) {
    var node = this.createElementNS(this.namespaces.gpx, "wpt");
    node.setAttribute("lon", geometry.x);
    node.setAttribute("lat", geometry.y);
    return node;
};

OpenLayers.Format.GPX.prototype.appendAttributesNode = function (node, feature) {
    var name = this.createElementNS(this.namespaces.gpx, 'name');
    name.appendChild(this.createTextNode(
        feature.attributes.name || feature.id));
    node.appendChild(name);
    var desc = this.createElementNS(this.namespaces.gpx, 'desc');
    desc.appendChild(this.createTextNode(
        feature.attributes.description || this.defaultDesc));
    node.appendChild(desc);
    // TBD - deal with remaining (non name/description) attributes.
};
// -------------------------------------------
// END fix issue 383
// -------------------------------------------

// -------------------------------------------
// START measurements show
// Show measurements near mouse when drawing or measuring
// Credits: https://github.com/jorix/OL-DynamicMeasure
// -------------------------------------------


/* Copyright 2011-2017 Xavier Mamano, http://github.com/jorix/OL-DynamicMeasure
 * Published under MIT license. */

/**
 * @requires OpenLayers/Control/Measure.js
 * @requires OpenLayers/Rule.js
 * @requires OpenLayers/StyleMap.js
 */

// /**
//  * Class: OpenLayers.Control.DynamicMeasure
//  * Allows for drawing of features for measurements.
//  *
//  * Inherits from:
//  *  - <OpenLayers.Control.Measure>
//  */
// OpenLayers.Control.DynamicMeasure = OpenLayers.Class(
//                                                    OpenLayers.Control.Measure, {
//
//     /**
//      * APIProperty: accuracy
//      * {Integer} Digits measurement accuracy, default is 5.
//      */
//     accuracy: 5,
//
//     /**
//      * APIProperty: persist
//      * {Boolean} Keep the temporary measurement after the
//      *     measurement is complete.  The measurement will persist until a new
//      *     measurement is started, the control is deactivated, or <cancel> is
//      *     called. Default is true.
//      */
//     persist: true,
//
//     /**
//      * APIProperty: styles
//      * {Object} Alterations of the default styles of the points lines poligons
//      *     and labels text, could use keys: "Point", "Line",
//      *     "Polygon", "labelSegments", "labelHeading", "labelLength" and
//      *     "labelArea". Default is <OpenLayers.Control.DynamicMeasure.styles>.
//      */
//     styles: null,
//
//     /**
//      * APIProperty: positions
//      * {Object} Alterations of the default position of the labels, could use
//      *     keys: "labelSegments" & "labelHeading", with values "start" "middle"
//      *     and "end" refered of the current segment; and keys: "labelLength" &
//      *     "labelArea" with additional values "center" (of the feature) and
//      *     "initial" (initial point of the feature) and also mentioned previus
//      *     values. Default is
//      *     <OpenLayers.Control.DynamicMeasure.positions>.
//      */
//     positions: null,
//
//     /**
//      * APIProperty: maxSegments
//      * {Integer|Null} Maximum number of visible segments measures, default is 1.
//      *
//      * To avoid soiling the track is desirable to reduce the number of visible
//      *     segments.
//      */
//     maxSegments: 1,
//
//     /**
//      * APIProperty: maxHeadings
//      * {Integer|Null} Maximum number of visible headings measures, default is 1.
//      *
//      * To avoid soiling the track is desirable to reduce the number of visible
//      *     segments.
//      */
//     maxHeadings: 1,
//
//     /**
//      * APIProperty: layerSegmentsOptions
//      * {Object} Any optional properties to be set on the
//      *     layer of <layerSegments> of the lengths of the segments. If set to
//      *     null the layer does not act.
//      *
//      *     If `styleMap` options is set then the key "labelSegments" of the
//      *     `styles` option is ignored.
//      */
//     layerSegmentsOptions: undefined,
//
//     /**
//      * APIProperty: layerHeadingOptions
//      * {Object} Any optional properties to be set on the
//      *     layer of <layerHeading> of the angle of the segments. If set to
//      *     null the layer does not act.  Default is null, set to {} to use a
//      *     <layerHeading> to show headings.
//      *
//      *     If `styleMap` options is set then the key "labelHeading" of the
//      *     `styles` option is ignored.
//      */
//     layerHeadingOptions: null,
//
//     /**
//      * APIProperty: layerLengthOptions
//      * {Object} Any optional properties to be set on the
//      *     layer of <layerLength> of the total length. If set to null the layer
//      *     does not act.
//      *
//      *     If `styleMap` option is set then the key "labelLength" of the
//      *     `styles` option is ignored.
//      */
//     layerLengthOptions: undefined,
//
//     /**
//      * APIProperty: layerAreaOptions
//      * {Object} Any optional properties to be set on the
//      *     layer of <layerArea> of the total area. If set to null the layer does
//      *     not act.
//      *
//      *     If `styleMap` is set then the key "labelArea" of the `styles` option
//      *     is ignored.
//      */
//     layerAreaOptions: undefined,
//
//     /**
//      * APIProperty: drawingLayer
//      * {<OpenLayers.Layer.Vector>} Drawing layer to store the drawing when
//      *     finished.
//      */
//     drawingLayer: null,
//
//     /**
//      * APIProperty: multi
//      * {Boolean} Cast features to multi-part geometries before passing to the
//      *     drawing layer, only used if declared a <drawingLayer>.
//      * Default is false.
//      */
//     multi: false,
//
//     /**
//      * APIProperty: keep
//      * {Boolean} Keep annotations for every measures.
//      */
//     keep: false,
//
//     /**
//      * Property: layerSegments
//      * {<OpenLayers.Layer.Vector>} The temporary drawing layer to show the
//      *     length of the segments.
//      */
//     layerSegments: null,
//
//     /**
//      * Property: layerLength
//      * {<OpenLayers.Layer.Vector>} The temporary drawing layer to show total
//      *     length.
//      */
//     layerLength: null,
//
//     /**
//      * Property: layerArea
//      * {<OpenLayers.Layer.Vector>} The temporary drawing layer to show total
//      *     area.
//      */
//     layerArea: null,
//
//     /**
//      * Property: layerSegmentsKeep
//      * {<OpenLayers.Layer.Vector>} The layer keep a copy of the length of
//      *     every segments measured since tool activation.
//      */
//     layerSegmentsKeep: null,
//
//     /**
//      * Property: layersLengthKeep
//      * {<OpenLayers.Layer.Vector>} The layer keep a copy of the length of
//      *     every polyline/poly measured since tool activation.
//      */
//     layerLengthKeep: null,
//
//     /**
//      * Property: layerAreaKeep
//      * {<OpenLayers.Layer.Vector>} The layer keep a copy of the area of every
//      *     polygon
//      */
//     layerAreaKeep: null,
//     /**
//      * Property: dynamicObj
//      * {Object} Internal use.
//      */
//     dynamicObj: null,
//
//     /**
//      * Property: isArea
//      * {Boolean} Internal use.
//      */
//     isArea: null,
//
//     /**
//      * Constructor: OpenLayers.Control.Measure
//      *
//      * Parameters:
//      * handler - {<OpenLayers.Handler>}
//      * options - {Object}
//      *
//      * Valid options:
//      * accuracy - {Integer} Digits measurement accuracy, default is 5.
//      * styles - {Object} Alterations of the default styles of the points lines
//      *     poligons and labels text, could use keys: "Point",
//      *     "Line", "Polygon", "labelSegments", "labelLength", "labelArea".
//      * positions - {Object} Alterations of the default position of the labels.
//      * handlerOptions - {Object} Used to set non-default properties on the
//      *     control's handler. If `layerOptions["styleMap"]` is set then the
//      *     keys: "Point", "Line" and "Polygon" of the `styles` option
//      *     are ignored.
//      * layerSegmentsOptions - {Object} Any optional properties to be set on the
//      *     layer of <layerSegments> of the lengths of the segments. If
//      *     `styleMap` is set then the key "labelSegments" of the `styles` option
//      *     is ignored. If set to null the layer does not act.
//      * layerLengthOptions - {Object} Any optional properties to be set on the
//      *     layer of <layerLength> of the total length. If
//      *     `styleMap` is set then the key "labelLength" of the `styles` option
//      *     is ignored. If set to null the layer does not act.
//      * layerAreaOptions - {Object} Any optional properties to be set on the
//      *     layer of <layerArea> of the total area. If
//      *     `styleMap` is set then the key "labelArea" of the `styles` option
//      *     is ignored. If set to null the layer does not act.
//      * layerHeadingOptions - {Object} Any optional properties to be set on the
//      *     layer of <layerHeading> of the angle of the segments. If
//      *     `styleMap` is set then the key "labelHeading" of the `styles` option
//      *     is ignored. If set to null the layer does not act.
//      * drawingLayer - {<OpenLayers.Layer.Vector>} Optional drawing layer to
//      *     store the drawing when finished.
//      * multi - {Boolean} Cast features to multi-part geometries before passing
//      *     to the drawing layer
//      * keep - {Boolean} Keep annotations for every measures.
//      */
//     initialize: function(handler, options) {
//
//         // Manage options
//         options = options || {};
//
//         // handlerOptions: persist & multi
//         options.handlerOptions = OpenLayers.Util.extend(
//             {persist: !options.drawingLayer}, options.handlerOptions
//         );
//         if (options.drawingLayer && !('multi' in options.handlerOptions)) {
//             options.handlerOptions.multi = options.multi;
//         }
//
//         // * styles option
//         if (options.drawingLayer) {
//             var sketchStyle = options.drawingLayer.styleMap &&
//                                  options.drawingLayer.styleMap.styles.temporary;
//             if (sketchStyle) {
//                 options.handlerOptions
//                                   .layerOptions = OpenLayers.Util.applyDefaults(
//                     options.handlerOptions.layerOptions, {
//                         styleMap: new OpenLayers.StyleMap({
//                             'default': sketchStyle
//                         })
//                     }
//                 );
//             }
//         }
//         var optionsStyles = options.styles || {};
//         options.styles = optionsStyles;
//         var defaultStyles = OpenLayers.Control.DynamicMeasure.styles;
//         // * * styles for handler layer.
//         if (!options.handlerOptions.layerOptions ||
//             !options.handlerOptions.layerOptions.styleMap) {
//             // use the style option for layerOptions of the handler.
//             var style = new OpenLayers.Style(null, {rules: [
//                 new OpenLayers.Rule({symbolizer: {
//                     'Point': OpenLayers.Util.applyDefaults(
//                                 optionsStyles.Point, defaultStyles.Point),
//                     'Line': OpenLayers.Util.applyDefaults(
//                                 optionsStyles.Line, defaultStyles.Line),
//                     'Polygon': OpenLayers.Util.applyDefaults(
//                                 optionsStyles.Polygon, defaultStyles.Polygon)
//                 }})
//             ]});
//             options.handlerOptions = options.handlerOptions || {};
//             options.handlerOptions.layerOptions =
//                                       options.handlerOptions.layerOptions || {};
//             options.handlerOptions.layerOptions.styleMap =
//                                     new OpenLayers.StyleMap({'default': style});
//         }
//
//         // * positions option
//         options.positions = OpenLayers.Util.applyDefaults(
//             options.positions,
//             OpenLayers.Control.DynamicMeasure.positions
//         );
//
//         // force some handler options
//         options.callbacks = options.callbacks || {};
//         if (options.drawingLayer) {
//             OpenLayers.Util.applyDefaults(options.callbacks, {
//                 create: function(vertex, feature) {
//                     this.callbackCreate(vertex, feature);
//                     this.drawingLayer.events.triggerEvent(
//                         'sketchstarted', {vertex: vertex, feature: feature}
//                     );
//                 },
//                 modify: function(vertex, feature) {
//                     this.callbackModify(vertex, feature);
//                     this.drawingLayer.events.triggerEvent(
//                         'sketchmodified', {vertex: vertex, feature: feature}
//                     );
//                 },
//                 done: function(geometry) {
//                     if (this.keep) {
//                         this.copyAnnotations();
//                     }
//                     this.callbackDone(geometry);
//                     this.drawFeature(geometry);
//                 }
//             });
//         }
//         OpenLayers.Util.applyDefaults(options.callbacks, {
//             create: this.callbackCreate,
//             point: this.callbackPoint,
//             cancel: this.callbackCancel,
//             done: this.callbackDone,
//             modify: this.callbackModify,
//             redo: this.callbackRedo,
//             undo: this.callbackUndo
//         });
//
//         // do a trick with the handler to avoid blue background in freehand.
//         var _self = this;
//         var oldOnselectstart = document.onselectstart ?
//                               document.onselectstart : OpenLayers.Function.True;
//         var handlerTuned = OpenLayers.Class(handler, {
//             down: function(evt) {
//                 document.onselectstart = OpenLayers.Function.False;
//                 return handler.prototype.down.apply(this, arguments);
//             },
//             up: function(evt) {
//                 document.onselectstart = oldOnselectstart;
//                 return handler.prototype.up.apply(this, arguments);
//             },
//             move: function(evt) {
//                 if (!this.mouseDown) {
//                     document.onselectstart = oldOnselectstart;
//                 }
//                 return handler.prototype.move.apply(this, arguments);
//             },
//             mouseout: function(evt) {
//                 if (OpenLayers.Util.mouseLeft(evt, this.map.viewPortDiv)) {
//                     if (this.mouseDown) {
//                         document.onselectstart = oldOnselectstart;
//                     }
//                 }
//                 return handler.prototype.mouseout.apply(this, arguments);
//             },
//             finalize: function() {
//                 document.onselectstart = oldOnselectstart;
//                 handler.prototype.finalize.apply(this, arguments);
//             }
//         }, {
//             undo: function() {
//                 var undone = handler.prototype.undo.call(this);
//                 if (undone) {
//                     this.callback('undo',
//                                  [this.point.geometry, this.getSketch(), true]);
//                 }
//                 return undone;
//             },
//             redo: function() {
//                 var redone = handler.prototype.redo.call(this);
//                 if (redone) {
//                     this.callback('redo',
//                                  [this.point.geometry, this.getSketch(), true]);
//                 }
//                 return redone;
//             }
//         });
//         // ... and call the constructor
//         OpenLayers.Control.Measure.prototype.initialize.call(
//                                                    this, handlerTuned, options);
//
//         this.isArea = handler.prototype.polygon !== undefined; // duck typing
//     },
//
//     /**
//      * APIMethod: destroy
//      */
//     destroy: function() {
//         this.deactivate();
//         this.emptyKeeped();
//         //keep status may have change, destroy layerXxxxxKeep anyway
//         if (this.layerSegmentsKeep) {
//             this.layerSegmentsKeep.destroy();
//             this.layerSegmentsKeep = null;
//         }
//         if (this.layerLengthKeep) {
//             this.layerLengthKeep.destroy();
//             this.layerLengthKeep = null;
//         }
//         if (this.layerAreaKeep) {
//             this.layerAreaKeep.destroy();
//             this.layerAreaKeep = null;
//         }
//         OpenLayers.Control.Measure.prototype.destroy.apply(this, arguments);
//     },
//
//     /**
//      * Method: draw
//      * This control does not have HTML component, so this method should
//      *     be empty.
//      */
//     draw: function() {},
//
//     /**
//      * APIMethod: activate
//      */
//     activate: function() {
//         var response = OpenLayers.Control.Measure.prototype.activate.apply(
//                                                                this, arguments);
//         if (response) {
//             // Create dynamicObj
//             this.dynamicObj = {};
//             // Create layers
//             var _optionsStyles = this.styles || {},
//                 _defaultStyles = OpenLayers.Control.DynamicMeasure.styles,
//                 _self = this;
//             var _create = function(styleName, initialOptions, nameSuffix) {
//                 nameSuffix = nameSuffix || '';
//                 if (initialOptions === null) {
//                     return null;
//                 }
//                 var options = OpenLayers.Util.extend({
//                     displayInLayerSwitcher: false,
//                     calculateInRange: OpenLayers.Function.True
//                     // ?? ,wrapDateLine: this.citeCompliant
//                 }, initialOptions);
//                 if (!options.styleMap) {
//                     var style = _optionsStyles[styleName];
//
//                     options.styleMap = new OpenLayers.StyleMap({
//                         'default': OpenLayers.Util.applyDefaults(style,
//                                                       _defaultStyles[styleName])
//                     });
//                 }
//                 var layer = new OpenLayers.Layer.Vector(
//                     _self.CLASS_NAME + ' ' + styleName + nameSuffix,
//                     options);
//                 _self.map.addLayer(layer);
//                 return layer;
//             };
//             this.layerSegments =
//                             _create('labelSegments', this.layerSegmentsOptions);
//             this.layerHeading =
//                             _create('labelHeading', this.layerHeadingOptions);
//             this.layerLength = _create('labelLength', this.layerLengthOptions);
//             if (this.isArea) {
//                 this.layerArea = _create('labelArea', this.layerAreaOptions);
//             }
//             if (this.keep) {
//                 if (!this.layerSegmentsKeep) {
//                     this.layerSegmentsKeep =
//                         _create('labelSegments', this.layerSegmentsOptions,
//                         'Keep');
//                 }
//                 if (!this.layerLengthKeep) {
//                     this.layerLengthKeep =
//                         _create('labelLength', this.layerLengthOptions,
//                         'Keep');
//                 }
//                 if (!this.layerAreaKeep) {
//                     this.layerAreaKeep =
//                         _create('labelArea', this.layerAreaOptions,
//                         'Keep');
//                 }
//             }
//         }
//         return response;
//     },
//
//     /**
//      * APIMethod: deactivate
//      */
//     deactivate: function() {
//         var response = OpenLayers.Control.Measure.prototype.deactivate.apply(
//                                                                this, arguments);
//         if (response) {
//             if (this.layerSegments) {
//                 this.layerSegments.destroy();
//             }
//             if (this.layerLength) {
//                 this.layerLength.destroy();
//             }
//             if (this.layerHeading) {
//                 this.layerHeading.destroy();
//             }
//             if (this.layerArea) {
//                 this.layerArea.destroy();
//             }
//             this.dynamicObj = null;
//             this.layerSegments = null;
//             this.layerLength = null;
//             this.layerHeading = null;
//             this.layerArea = null;
//         }
//         return response;
//     },
//
//     /**
//      * APIMethod: emptyKeeped
//      * Remove annotations from layers layerSegmentsKeep, layerLengthKeep,
//      * layerAreaKeep.
//      */
//      emptyKeeped: function () {
//         if (this.layerSegmentsKeep) {
//             this.layerSegmentsKeep.destroyFeatures();
//         }
//         if (this.layerLengthKeep) {
//             this.layerLengthKeep.destroyFeatures();
//         }
//         if (this.layerAreaKeep) {
//             this.layerAreaKeep.destroyFeatures();
//         }
//     },
//
//     /**
//      * APIMethod: setImmediate
//      * Sets the <immediate> property. Changes the activity of immediate
//      * measurement.
//      */
//     setImmediate: function(immediate) {
//         this.immediate = immediate;
//     },
//
//     /**
//      * Method: callbackCreate
//      */
//     callbackCreate: function() {
//         var dynamicObj = this.dynamicObj;
//         dynamicObj.drawing = false;
//         dynamicObj.freehand = false;
//         dynamicObj.fromIndex = 0;
//         dynamicObj.countSegments = 0;
//     },
//
//     /**
//      * Method: callbackCancel
//      */
//     callbackCancel: function() {
//         this.destroyLabels();
//     },
//
//     /**
//      * Method: callbackDone
//      * Called when the measurement sketch is done.
//      *
//      * Parameters:
//      * geometry - {<OpenLayers.Geometry>}
//      */
//     callbackDone: function(geometry) {
//         this.measureComplete(geometry);
//         if (!this.persist) {
//             this.destroyLabels();
//         }
//     },
//
//     /**
//      * Method: drawFeature
//      */
//     drawFeature: function(geometry) {
//         var feature = new OpenLayers.Feature.Vector(geometry);
//         var proceed = this.drawingLayer.events.triggerEvent(
//             'sketchcomplete', {feature: feature}
//         );
//         if (proceed !== false) {
//             feature.state = OpenLayers.State.INSERT;
//             this.drawingLayer.addFeatures([feature]);
//             if (this.featureAdded) {
//                 // for compatibility
//                 this.featureAdded(feature);
//             }
//             this.events.triggerEvent('featureadded', {feature: feature});
//         }
//     },
//
//     /**
//      * Method: copyAnnotations
//      */
//     copyAnnotations: function() {
//         var _insertable = function(feat) {
//             feat.state = OpenLayers.State.INSERT;
//         };
//         // Segments measures
//         var segments = this.layerSegments.clone();
//         var segmentsFeatures = segments.features;
//         for(i = 0; i > segmentsFeatures.length; i++) {
//             segmentsFeatures[i].state = OpenLayers.State.INSERT;
//         }
//         this.layerSegmentsKeep.addFeatures(segmentsFeatures);
//         // Length measures
//         var lengths = this.layerLength.clone();
//         var lengthsFeatures = lengths.features;
//         for(i = 0; i > lengthsFeatures.length; i++) {
//             lengthsFeatures[i].state = OpenLayers.State.INSERT;
//         }
//         this.layerLengthKeep.addFeatures(lengthsFeatures);
//         // Area measures
//         if (this.isArea) {
//             var areas = this.layerArea.clone();
//             var areasFeatures = areas.features;
//             for(i = 0; i > areasFeatures.length; i++) {
//                 areasFeatures[i].state = OpenLayers.State.INSERT;
//             }
//             this.layerAreaKeep.addFeatures(areasFeatures);
//         }
//     },
//
//     /**
//      * Method: callbackCancel
//      */
//     destroyLabels: function() {
//         if (this.layerSegments) {
//             this.layerSegments.destroyFeatures(null, {silent: true});
//         }
//         if (this.layerLength) {
//             this.layerLength.destroyFeatures(null, {silent: true});
//         }
//         if (this.layerHeading) {
//             this.layerHeading.destroyFeatures(null, {silent: true});
//         }
//         if (this.layerArea) {
//             this.layerArea.destroyFeatures(null, {silent: true});
//         }
//     },
//
//     /**
//      * Method: callbackPoint
//      */
//     callbackPoint: function(point, geometry) {
//         var dynamicObj = this.dynamicObj;
//         if (!dynamicObj.drawing) {
//             this.destroyLabels();
//         }
//         if (!this.handler.freehandMode(this.handler.evt)) {
//             dynamicObj.fromIndex = this.handler.getCurrentPointIndex() - 1;
//             dynamicObj.freehand = false;
//             dynamicObj.countSegments++;
//         } else if (!dynamicObj.freehand) {
//             // freehand has started
//             dynamicObj.fromIndex = this.handler.getCurrentPointIndex() - 1;
//             dynamicObj.freehand = true;
//             dynamicObj.countSegments++;
//         }
//
//         this.measurePartial(point, geometry);
//         dynamicObj.drawing = true;
//     },
//
//     /**
//      * Method: callbackUndo
//      */
//     callbackUndo: function(point, feature) {
//         var _self = this,
//             undoLabel = function(layer) {
//                 if (layer) {
//                     var features = layer.features,
//                         lastSegmentIndex = features.length - 1,
//                         lastSegment = features[lastSegmentIndex],
//                         lastSegmentFromIndex = lastSegment.attributes.from,
//                         lastPointIndex = _self.handler.getCurrentPointIndex();
//                     if (lastSegmentFromIndex >= lastPointIndex) {
//                         var dynamicObj = _self.dynamicObj;
//                         layer.destroyFeatures(lastSegment);
//                         lastSegment = features[lastSegmentIndex - 1];
//                         dynamicObj.fromIndex = lastSegment.attributes.from;
//                         dynamicObj.countSegments = features.length;
//                     }
//                 }
//             };
//         undoLabel(this.layerSegments);
//         undoLabel(this.layerHeading);
//         this.callbackModify(point, feature, true);
//     },
//
//     /**
//      * Method: callbackRedo
//      */
//     callbackRedo: function(point, feature) {
//         var line = this.handler.line.geometry,
//             currIndex = this.handler.getCurrentPointIndex();
//         var dynamicObj = this.dynamicObj;
//         this.showLabelSegment(
//             dynamicObj.countSegments,
//             dynamicObj.fromIndex,
//             line.components.slice(dynamicObj.fromIndex, currIndex)
//         );
//         dynamicObj.fromIndex = this.handler.getCurrentPointIndex() - 1;
//         dynamicObj.countSegments++;
//         this.callbackModify(point, feature, true);
//     },
//
//     /**
//      * Method: callbackModify
//      */
//     callbackModify: function(point, feature, drawing) {
//         if (this.immediate) {
//             this.measureImmediate(point, feature, drawing);
//         }
//
//         var dynamicObj = this.dynamicObj;
//         if (dynamicObj.drawing === false) {
//            return;
//         }
//
//         var line = this.handler.line.geometry,
//             currIndex = this.handler.getCurrentPointIndex();
//         if (!this.handler.freehandMode(this.handler.evt) &&
//                                                           dynamicObj.freehand) {
//             // freehand has stopped
//             dynamicObj.fromIndex = currIndex - 1;
//             dynamicObj.freehand = false;
//             dynamicObj.countSegments++;
//         }
//
//         // total measure
//         var totalLength = this.getBestLength(line);
//         if (!totalLength[0]) {
//            return;
//         }
//         var positions = this.positions,
//             positionGet = {
//             center: function() {
//                 var center = feature.geometry.getBounds().clone();
//                 center.extend(point);
//                 center = center.getCenterLonLat();
//                 return [center.lon, center.lat];
//             },
//             initial: function() {
//                 var initial = line.components[0];
//                 return [initial.x, initial.y];
//             },
//             start: function() {
//                 var start = line.components[dynamicObj.fromIndex];
//                 return [start.x, start.y];
//             },
//             middle: function() {
//                 var start = line.components[dynamicObj.fromIndex];
//                 return [(start.x + point.x) / 2, (start.y + point.y) / 2];
//             },
//             end: function() {
//                 return [point.x, point.y];
//             }
//         };
//         if (this.layerLength) {
//             this.showLabel(
//                         this.layerLength, 1, 0, totalLength,
//                         positionGet[positions.labelLength](), 1);
//         }
//         if (this.isArea) {
//             if (this.layerArea) {
//                 var totalArea = this.getBestArea(feature.geometry);
//                 if (totalArea[0] || this.layerArea.features.length) {
//                     this.showLabel(this.layerArea, 1, 0,
//                               totalArea, positionGet[positions.labelArea](), 1);
//                 }
//             }
//             if (this.showLabelSegment(
//                       1, 0, [line.components[currIndex], line.components[0]])) {
//                 dynamicObj.countSegments++;
//             }
//         }
//         this.showLabelSegment(
//             dynamicObj.countSegments,
//             dynamicObj.fromIndex,
//             line.components.slice(dynamicObj.fromIndex, currIndex + 1)
//         );
//     },
//
//     /**
//      * Function: showLabelSegment
//      *
//      * Parameters:
//      * labelsNumber- {Integer} Number of the labels to be on the label layer.
//      * fromIndex - {Integer} Index of the last point on the measured feature.
//      * points - Array({<OpenLayers.Geometry.Point>})
//      *
//      * Returns:
//      * {Boolean}
//      */
//     showLabelSegment: function(labelsNumber, fromIndex, _points) {
//         var layerSegments = this.layerSegments,
//             layerHeading = this.layerHeading;
//         if (!layerSegments && !layerHeading) {
//             return false;
//         }
//         // clone points
//         var points = [],
//             pointsLen = _points.length;
//         for (var i = 0; i < pointsLen; i++) {
//             points.push(_points[i].clone());
//         }
//         var segmentLength =
//                  this.getBestLength(new OpenLayers.Geometry.LineString(points));
//         if (segmentLength[0] == 0) {
//             return false;
//         }
//         var positions = this.positions,
//             from = points[0],
//             to = points[pointsLen - 1],
//             positionGet = {
//                 start: function() {
//                     return [from.x, from.y];
//                 },
//                 middle: function() {
//                     return [(from.x + to.x) / 2, (from.y + to.y) / 2];
//                 },
//                 end: function() {
//                     return [to.x, to.y];
//                 }
//             },
//             created = false;
//         if (layerSegments) {
//             created = this.showLabel(layerSegments, labelsNumber, fromIndex,
//                             segmentLength,
//                             positionGet[positions.labelSegments](),
//                             this.maxSegments);
//         }
//         if (layerHeading) {
//             var heading = Math.atan2(to.y - from.y, to.x - from.x),
//                 bearing = 90 - heading * 180 / Math.PI;
//             if (bearing < 0) {
//                 bearing += 360;
//             }
//             created = this.showLabel(layerHeading,
//                             labelsNumber, fromIndex,
//                             [bearing, '°'],
//                             positionGet[positions.labelHeading](),
//                             this.maxHeadings) || created;
//         }
//         return created;
//     },
//
//     /**
//      * Function: showLabel
//      *
//      * Parameters:
//      * layer - {<OpenLayers.Layer.Vector>} Layer of the labels.
//      * labelsNumber- {Integer} Number of the labels to be on the label layer.
//      * fromIndex - {Integer} Index of the last point on the measured feature.
//      * measure - Array({Float|String}) Measure provided by OL Measure control.
//      * points - Array({Fload}) Array of x and y of the point to draw the label.
//      * maxSegments - {Integer|Null} Maximum number of visible segments measures
//      *
//      * Returns:
//      * {Boolean}
//      */
//     showLabel: function(
//                      layer, labelsNumber, fromIndex, measure, xy, maxSegments) {
//         var featureLabel, featureAux,
//             features = layer.features;
//         if (features.length < labelsNumber) {
//         // add a label
//             featureLabel = new OpenLayers.Feature.Vector(
//                 new OpenLayers.Geometry.Point(xy[0], xy[1]),
//                 {from: fromIndex}
//             );
//             this.setMesureAttributes(featureLabel.attributes, measure);
//             layer.addFeatures([featureLabel]);
//             if (maxSegments !== null) {
//                 var hide = (features.length - maxSegments) - 1;
//                 if (hide >= 0) {
//                     featureAux = features[hide];
//                     featureAux.style = {display: 'none'};
//                     layer.drawFeature(featureAux);
//                 }
//             }
//             return true;
//         } else {
//         // update a label
//             featureLabel = features[labelsNumber - 1];
//             var geometry = featureLabel.geometry;
//             geometry.x = xy[0];
//             geometry.y = xy[1];
//             geometry.clearBounds();
//             this.setMesureAttributes(featureLabel.attributes, measure);
//             layer.drawFeature(featureLabel);
//             if (maxSegments !== null) {
//                 var show = (features.length - maxSegments);
//                 if (show >= 0) {
//                     featureAux = features[show];
//                     if (featureAux.style) {
//                         delete featureAux.style;
//                         layer.drawFeature(featureAux);
//                     }
//                 }
//             }
//             return false;
//         }
//     },
//
//     /**
//      * Method: setMesureAttributes
//      * Format measure[0] with digits of <accuracy>. Could internationalize the
//      *     format customizing <OpenLayers.Number.thousandsSeparator> and
//      *     <OpenLayers.Number.decimalSeparator>
//      *
//      * Parameters:
//      * attributes - {object} Target attributes.
//      * measure - Array({*})
//      */
//     setMesureAttributes: function(attributes, measure) {
//         attributes.measure = OpenLayers.Number.format(
//                            Number(measure[0].toPrecision(this.accuracy)), null);
//         attributes.units = measure[1];
//     },
//
//     CLASS_NAME: 'OpenLayers.Control.DynamicMeasure'
// });
//
// /**
//  * Constant: OpenLayers.Control.DynamicMeasure.styles
//  * Contains the keys: "Point", "Line", "Polygon",
//  *     "labelSegments", "labelHeading", "labelLength" and
//  *     "labelArea" as a objects with style keys.
//  */
// OpenLayers.Control.DynamicMeasure.styles = {
//     'Point': {
//         pointRadius: 4,
//         graphicName: 'square',
//         fillColor: 'white',
//         fillOpacity: 1,
//         strokeWidth: 1,
//         strokeOpacity: 1,
//         strokeColor: '#333333'
//     },
//     'Line': {
//         strokeWidth: 2,
//         strokeOpacity: 1,
//         strokeColor: '#666666',
//         strokeDashstyle: 'dash'
//     },
//     'Polygon': {
//         strokeWidth: 2,
//         strokeOpacity: 1,
//         strokeColor: '#666666',
//         strokeDashstyle: 'solid',
//         fillColor: 'white',
//         fillOpacity: 0.3
//     },
//     labelSegments: {
//         label: '${measure} ${units}',
//         fontSize: '11px',
//         fontColor: '#800517',
//         fontFamily: 'Verdana',
//         labelOutlineColor: '#dddddd',
//         labelAlign: 'cm',
//         labelOutlineWidth: 2
//     },
//     labelLength: {
//         label: '${measure} ${units}\n',
//         fontSize: '11px',
//         fontWeight: 'bold',
//         fontColor: '#800517',
//         fontFamily: 'Verdana',
//         labelOutlineColor: '#dddddd',
//         labelAlign: 'lb',
//         labelOutlineWidth: 3
//     },
//     labelArea: {
//         label: '${measure}\n${units}²\n',
//         fontSize: '11px',
//         fontWeight: 'bold',
//         fontColor: '#800517',
//         fontFamily: 'Verdana',
//         labelOutlineColor: '#dddddd',
//         labelAlign: 'cm',
//         labelOutlineWidth: 3
//     },
//     labelHeading: {
//         label: '${measure} ${units}',
//         fontSize: '11px',
//         fontColor: '#800517',
//         fontFamily: 'Verdana',
//         labelOutlineColor: '#dddddd',
//         labelAlign: 'cm',
//         labelOutlineWidth: 3
//     }
// };
//
// /**
//  * Constant: OpenLayers.Control.DynamicMeasure.positions
//  * Contains the keys: "labelSegments", "labelHeading",
//  *     "labelLength" and "labelArea" as a strings with values 'start',
//  *     'middle' and 'end' allowed for all keys (refered of last segment) and
//  *     'center' and 'initial' (refered of the measured feature and only allowed
//  *     for "labelLength" and "labelArea" keys)
//  */
// OpenLayers.Control.DynamicMeasure.positions = {
//     labelSegments: 'middle',
//     labelLength: 'end',
//     labelArea: 'center',
//     labelHeading: 'start'
// };
//
// /**
//  * Class: OpenLayers.Control.DynamicMeasurePath
//  * Allows for drawing of features for measurements (Path).
//  *
//  * Inherits from:
//  *  - <OpenLayers.Control.DynamicMeasure>
//  */
// OpenLayers.Control.DynamicMeasurePath = OpenLayers.Class(
//                                                    OpenLayers.Control.DynamicMeasure, {
//
//         initialize: function (handler, options) {
//             // ... and call the constructor
//             OpenLayers.Control.DynamicMeasure.prototype.initialize.call(
//                 this, OpenLayers.Handler.Path, options);
//         }
//     }
// );
//
// // -------------------------------------------
// // END measurements show
// // -------------------------------------------


