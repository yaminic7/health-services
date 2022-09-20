var express = require('express');
var app = express();

const scoreAPI = require('./sweb-hub.js');

module.exports.getConceptByPrefix = async (std, code, targetLang) => {

	console.log('Sweb-api >>> getConceptByPrefix ['+std+'_'+code+']');
	var concept = await scoreAPI.getConceptByPrefix(std, code, targetLang);
	return concept;
};

module.exports.getConceptIDByPrefix = async (prefix) => {

	console.log('Sweb-api >>> getConceptIDByPrefix ['+prefix+']');
	var conceptID = await scoreAPI.getConceptIDByPrefix(prefix);
	return conceptID;
};

module.exports.getTypeById = async (typeId) => {

	console.log('Sweb-api >>> getTypeById ['+typeId+']');
	var type = await scoreAPI.getTypeById(typeId);
	return type;
};

module.exports.getTypeIdByPrefix = async (prefix) => {

	console.log('Sweb-api >>> getTypeIdByPrefix ['+prefix+']');
	var typeId = await scoreAPI.getTypeIdByPrefix(prefix);
	return typeId;
};

module.exports.getEntityById = async (entityId) => {

	console.log('Sweb-api >>> getEntityById ['+entityId+']');
	var entity = await scoreAPI.getEntityById(entityId);
	return entity;
};

module.exports.getEntitiesByTypeId = async (typeId) => {

	console.log('Sweb-api >>> getEntitiesByTypeId ['+typeId+']');
	var entities = await scoreAPI.getEntitiesByTypeId(typeId);
	return entities;
};

module.exports.getEntitiesIDByTypeId = async (typeId) => {

	console.log('Sweb-api >>> getEntitiesIDByTypeId ['+typeId+']');
	var entitiesIDs = await scoreAPI.getEntitiesIDByTypeId(typeId);
	return entitiesIDs;
};

module.exports.getEntityIDByTypeIDAndIdentifier = async (typeId, identifier) => {

	console.log('Sweb-api >>> getEntityIDByTypeIDAndIdentifier ['+typeId+', '+identifier+']');
	var ID = await scoreAPI.getEntityIDByTypeIDAndIdentifier(typeId, identifier);
	return ID;
};

module.exports.getSensesByConceptId = async (conceptId) => {

	console.log('Sweb-api >>> getSensesByConceptId ['+conceptId+']');
	var sense = await scoreAPI.getSensesByConceptId(conceptId);
	return sense;
};

module.exports.getInstancesSearch = async (conceptId, instanceIdValue) => {

	console.log('Sweb-api >>> getInstancesSearch ['+instanceIdValue+']');
	var enityList = await scoreAPI.getInstancesSearch(conceptId, instanceIdValue);
	return enityList;
};

module.exports.getLinkedEntities = async (attribute, entityId) => {

	console.log('Sweb-api >>> getLinkedEntities ['+attribute+' - '+entityId+']');
	var enityList = await scoreAPI.getLinkedEntities(attribute, entityId);
	return enityList;
};

module.exports.getSynsetByConceptId = async (conceptId) => {

	console.log('Sweb-api >>> getSynsetByConceptId ['+conceptId+']');
	var synset = await scoreAPI.getSynsetByConceptId(conceptId);
	return synset;
};

module.exports.getWordsBySynsetId = async (synsetId) => {

	console.log('Sweb-api >>> getWordsBySynsetId ['+synsetId+']');
	var words = await scoreAPI.getWordsBySynsetId(synsetId);
	return words;
};

module.exports.deleteInstance = async (instanceId) => {

	console.log('Sweb-api >>> deleteInstance ['+instanceId+']');
	var response = await scoreAPI.deleteInstance(instanceId);
	return response;
};

module.exports.deleteInstanceRange = async (startInstanceId, endInstanceId) => {

	console.log('Sweb-api >>> deleteInstanceRange ['+startInstanceId+" - "+endInstanceId+']');
	var response = await scoreAPI.deleteInstanceRange(startInstanceId, endInstanceId);
	return response;
};