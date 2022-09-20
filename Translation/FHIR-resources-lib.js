
module.exports.createExtension = async (lang, content, bundleResourcesList, resourceRef) => {

    var langObject = {
        "url": "lang",
        "valueCode": lang
    }
    
    var contentObject = {
        "url": "content",
        "valueString": content
    }

    var array = []
    array.push(langObject)
    array.push(contentObject)

    let ts = Date.now();
    let provenanceRef = await this.createProvenance(Math.floor(ts), resourceRef.resource.resourceType+"/"+resourceRef.resource.id, bundleResourcesList)
    
    if (provenanceRef != null){
        var provenanceObject = {
            "url": "http://interopehrate.eu/fhir/StructureDefinition/ExtendedTranslation-IEHR",
            "valueReference": {
                "reference": "Provenance/"+provenanceRef
                }
        }
        array.push(provenanceObject)
    }

    var extensionInternal = {
        "extension": array,
        "url": "http://hl7.org/fhir/StructureDefinition/translation"
    }

    //console.log(JSON.stringify(extensionElem))
    return extensionInternal
}

let createDevice = async () =>{
	return {
		"fullUrl": "IEHR/fhir/Device/1",
    	"resource": {
      		"resourceType": "Device",
      		"id": "1",
      		"status": "active",
      		"deviceName": [ {
        		"name": "iehr-translation-service",
        		"type": "other"
      		} ]
    	}
	}
}

/*
provId : uuidv1();
targetRes : fhir resource managed by the service
bundleResourcesList : bundle to append provenance
*/
module.exports.createProvenance = async (provId, targetRes, bundleResourcesList) =>{

    let currentDateTimeISO = new Date().toISOString()

	var provenance = {
		"fullUrl": "IEHR/fhir/Provenance/"+provId+"/"+targetRes,
		"resource": {
			"resourceType": "Provenance",
			"id": provId+"",
		  	"target": [ {
				"reference": targetRes
		  	} ],
		 	"occurredDateTime": currentDateTimeISO,
		  	"recorded": currentDateTimeISO,
		  	"agent": [ {
				"who": {
			  		"reference": "Device/1"
				}
		  	} ]
		}
    }
    if (! await existingResource(provenance, bundleResourcesList)){
        bundleResourcesList.push(provenance)
        let device = await createDevice()

        if (! await existingResource(device, bundleResourcesList))
            bundleResourcesList.push(device)
    }
    return provId
    
}

let existingResource = async (res, bundleResourcesList) => {

    for (entry of bundleResourcesList)
        if (entry.fullUrl == res.fullUrl) return true
    return false
}