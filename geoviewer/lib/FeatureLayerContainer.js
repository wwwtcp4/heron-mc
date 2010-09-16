/*
 * Copyright (C) 2010  Het Kadaster - The Netherlands
 *
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
 * @requires GeoExt/widgets/tree/LayerContainer.js
 */
Ext.namespace("GeoExt.tree");

/** api: (define)
 *  module = GeoExt.tree
 *  class = OverlayLayerContainer
 */

/** api: (extends)
 * GeoExt/widgets/tree/LayerContainer.js
 */

/** api: constructor
 * .. class:: OverlayLayerContainer
 *
 *	 A layer container that will collect all overlay layers of an OpenLayers
 *	 map. Only layers that have displayInLayerSwitcher set to true will be
 *	 included.
 *
 *	 To use this node type in ``TreePanel`` config, set nodeType to
 *	 "gx_overlaylayercontainer".
 */
GeoExt.tree.FeatureLayerContainer = Ext.extend(GeoExt.tree.LayerContainer, {

	featureType : null,

	/** private: method[constructor]
	 *  Private constructor override.
	 */
	constructor: function(config) {
		// Assign the feature type string name (is index into theme in Catalog)
		this.featureType = config.featureType;

		config = Ext.applyIf(config || {}, {
			leaf: true,
			checked: false
		});

		GeoExt.tree.FeatureLayerContainer.superclass.constructor.call(this, config);
	},


	/** private: method[render]
	 *  :param bulkRender: ``Boolean``
	 */
	render: function(bulkRender) {
		// Get the featureType object from the theme (original from the Catalog)
		this.featureType = this.parentNode.theme.featureTypes[this.featureType];
		this.text = this.featureType.name;

		// Set callback when checked/unchecked
		this.on({
			"checkchange": this.onCheckChange, scope: this
			
		});

		GeoExt.tree.LayerNode.superclass.render.apply(this, arguments);
	},

	/** private: method[onCheckChange]
	 *  :param node: ``GeoExt.tree.LayerNode``
	 *  :param checked: ``Boolean``
	 *
	 *  handler for checkchange events
	 */
	onCheckChange: function(node, checked) {
		var layers = this.featureType.layers;
		//TODO: create/destroy featuretype-store
		createDataStore(node, checked);
		for (var i = 0; i < layers.length; i++) {
			GeoViewer.Catalog.layers[layers[i]].setVisibility(checked);
			//TODO: check if the eventlisteners already exist
			GeoViewer.Catalog.layers[layers[i]].events.on({"featuresadded":  this.featuresAdded});
			GeoViewer.Catalog.layers[layers[i]].events.on({"featuresremoved":  this.featuresRemoved});
		}
	},
	
	//Function called when features have been added to the map
	//Once features have been added to the map, these features have to be applied to the correct datastore
	featuresAdded: function() {
		alert('true');
	}
	
	//Function called when features have been removed from the map
	//
	featuresRemoved: function() {
		alert('false');
	}

});
	// Function to create DataStores for each enabled FeatureType
	function createDataStore(node, checked) {
		var storeName = node.attributes.featureType; 
		if(checked) {
			Ext.namespace("GeoViewer.Stores");
			if(!GeoViewer.Stores[storeName]) {
				GeoViewer.Stores[storeName] = new GeoExt.data.FeatureStore({});
			}
			var agasg= 1;
		}
		else {
		
			GeoViewer.Stores[storeName].destroy();
		
		}
	};
/**
 * NodeType: gx_FeatureLayerContainer
 */
Ext.tree.TreePanel.nodeTypes.gx_featurelayercontainer = GeoExt.tree.FeatureLayerContainer;
