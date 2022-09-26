# NER and Relation Extraction from EHR
This repository includes code for NER and RE methods on EHR records. These methods were performed on [n2c2 2018 challenge dataset](https://portal.dbmi.hms.harvard.edu/projects/n2c2-2018-t2/) which was augmented to include a sample of [ADE corpus dataset](https://paperswithcode.com/sota/relation-extraction-on-ade-corpus). This project serves as a capstone project for my Masters in Data Science degree at Northeastern University. A demo of this project can be accessed at [ehr-info.ml](http://ehr-info.ml). The website might not work if the GCP instance is turned off (it costs a lot of money, especially for a student).

- [How to Run](#how-to-run)
- [Introduction](#introduction)
- [Named Entity Recognition](#named-entity-recognition-ner)
    - [NER Data Preprocessing](#ner-data-preprocessing)
    - [BioBERT for NER](#biobert-for-ner)
    - [NER Results](#ner-results)
- [Front-end and API deployment](#front-end-and-api-deployment)
    - [FastAPI](#fastapi)
    - [Front-End website](#front-end-website)
    - [Deployment on GCP](#deployment-on-gcp)
- [References](#references)

# How to Run
### Using Makefile (for linux-based systems)
Edit the Makefile for any parameter changes that you want. All parameters are defined at the top of the file. Check expected parameter values in the next section.
- Generate data: `make generate-data`
- Train BioBERT for NER: `make train-biobert-ner`
- Run API in development mode with debugging: `make start-api-local`
- Run API in production mode: `make start-api-gcp`
- Run the front-end: Edit the IP address for AJAX call in `front-end/ehr.html` and open the HTML file in a browser.

### Using direct commands from terminal
- To generate the preprocessed data required for model input
    ```
    python generate_data.py \
        --task ner \
        --input_dir data/ \
        --ade_dir ade_corpus/ \
        --target_dir dataset/ \
        --max_seq_len 512 \
        --dev_split 0.1 \
        --tokenizer biobert-base \
        --ext txt \
        --sep " " \
    ```
    
    - The `task` parameter can be either `ner` or `re` for Named Entity Recognition and Relation Extraction tasks respectively. 
    - The input directory should have two folders named `train` and `test` in them. Each folder should have `txt` and `ann` files from the original dataset.
    - `ade_dir` is an optional parameter. It should contain json files from the ADE Corpus dataset.
    - The `max_seq_len` should not exceed `512` for BioBERT models.
    - For BioBERT models, use `biobert-base` as the `tokenizer` value and for BiLSTM + CRF model, use `scispacy_plus`.
    - Use `txt` for the `ext` (extension) parameter and `" "` as the `sep` (seperator) parameter for NER, and `tsv` extension and `tab` as the seperator for RE.

- Instructions for running individual models can be found in their respective directories.

- To run the API in development mode with debugging on, run the following command:
    ```
    uvicorn fast_api:app --reload
    ```

- To run the API in production mode with gunicorn, run the following command:
    ```
    gunicorn -b 0.0.0.0:8000 -w 4 -k uvicorn.workers.UvicornWorker fast_api:app --timeout 120
    ```

- To run the front-end, edit the IP address for AJAX call in `front-end/ehr.html` and open the HTML file in a browser.

# Introduction
An Electronic Health Record (EHR) [[1]](https://www.cms.gov/Medicare/E-Health/EHealthRecords) is an electronic version of a patient's medical history that includes extremely important information including, but not limited to, problems, medication, progress notes, immunizations and laboratory reports. EHRs are huge free-text data files that are documented by healthcare professionals, like clinical notes, discharge summaries or lab reports. Finding information from this data is time consuming, since the data is unstructured and there may be multiple such records for a single patient. Natural Language Processing (NLP) techniques could be used to make this data structured, and quickly find information whenever needed, thereby saving healthcare professionals' time from these mundane tasks.

In this project, we aim to build a tool that would automatically structure this data into a format that would enable doctors and patients to quickly find information that they need. Specifically, we aim to build a Named Entity Recognition (NER) model that would recognize entities such as drug, strength, duration, frequency, adverse drug event (ADE) [[2]](https://www.cdc.gov/medicationsafety/adult_adversedrugevents.html), reason for taking the drug, route and form. Further, the model would also recognize the relationship between drug and every other named entity as well. This would allow healthcare professionals to not only look at individual entities, but also all the relationships between them. This would also allow the doctors to easily find out the relationships between a drug and ADEs so that such drugs can be monitored carefully. \par

The final goal of this project is to build an API where healthcare professionals and patients could send EHR data and the API would return character ranges for each annotation so they can be highlighted in the original data, a structured json-format data that includes separately labelled data for medication history and discharge medications. The highlighted annotations could be useful when a healthcare professional wants to see important information along with other details in the EHR. The structured information can be used to store the data for quick reference in the future. Because the EHR contains medication history as well as discharge medications, labelling them as such could help in merging new information, as the medication history would remain the same.

# Named Entity Recognition (NER)
To identify named entities from the text, three different models were built. A rule-based model was built as  a baseline along with two machine learning models.

## NER Data Preprocessing
EHR documents are usually lengthy, and it is not desirable to have such big input sizes for machine learning models, especially for models like BERT that have an input size restriction of 512 tokens. So, a function was implemented that would split the EHR records based on a maximum sequence length parameter. The function tries to include maximum number of tokens, maintaining as much context as possible for every token. The splitting points are decided based on the following criteria:

1) Includes as many paragraphs as possible within the maximum token limit, and splits at the end of the last paragraph found.
2) If the function cannot find a single complete paragraph, it splits on the last line (within the token limit) which marks the end of a sentence.
3) Otherwise, the function includes as many tokens as specified by the token limit, and then splits on the next index.

The data is tokenized using a modified ScispaCy tokenizer for BiLSTM + CRF model which just removes the tokens with whitespace characters after ScispaCy tokenizes them. For BioBERT model, the BioBERT base tokenizer was used to tokenize the data. Each sequence of labels or tokens in the data was represented using the IOB2 (Inside, Outside, Beginning) tagging scheme for BioBERT and BiLSTM models.

## BioBERT for NER
The output of each token from the BERT model is passed through a fully connected neural network with a softmax layer at the end that classify that token to an entity. The entities here would be in IOB format, for example B-DRUG and I-DRUG would be treated as separate entities. This entire model is called BERT for token classification, and it's architecture is available in python's transformers library [[7]](https://huggingface.co/transformers/).

BioBERT is a pre-trained BERT model, that is trained on medical corpra of more than 18 billion words. Since it has a medical vocabulary and is trained on biomedical data, we chose this model to fine tune on our dataset. Code for fine tuning from the official BioBERT for PyTorch GitHub repository [[8]](https://github.com/dmis-lab/biobert-pytorch/tree/master/named-entity-recognition) was used with modifications in input format. The input sequence length was set to 128, and the model was fine tuned for 5 epochs using GPU resources from Google Cloud compute engine.   

## FastAPI
An end-to-end pipeline was created to transform raw EHR documents into a structured, and more intuitive form. First, the raw EHR document is preprocessed for a Named Entity Recognition model. This preprocessed data is then sent passed through either BiLSTM + CRF model or BioBERT model for NER based on user's choice, to get predictions of entities present in the EHR document. Using these predicted entities, the raw EHR is again preprocessed for the Relation Extraction model. After getting the predictions of relationships among the entities, a table and a knowledge graph is generated which maps each drug to all of its related entities. The relation table is created using the python pandas package and the knowledge graph is created using python's networkx package.

This end-to-end pipeline was converted into an API using a python web-framework named FastAPI [[9]](https://fastapi.tiangolo.com/). This package allows building a production-ready API and is compatible with HTTP web servers like Gunicorn [[10]](https://gunicorn.org/).

## Front-end Website
To visualize the results of the end-to-end pipeline, a static front-end website was built using HTML, Bootstrap and jQuery. The Bootstrap framework ensures that the website layout changes automatically if the website is accessed on a mobile device. The website provides an option to choose the NER model and an option to either upload or type/paste an EHR document. It also provides the user with an option to load a sample EHR document for the user to test the results. Once the user requests for the results, an AJAX [[11]](https://api.jquery.com/Jquery.ajax/) call is made to the API which sends the EHR text and the NER model choice to the API. The API then runs the entire pipeline and transfers the results to the website.

To visualize the results and make it more user friendly, the website highlights each entity with a different color and hovering over the highlighted text gives a tooltip of the entity type. To visualize the relations of an entity, hovering over an entity creates a red colored border around all other entities that are related to it. The website also has an option to visualize all the relations in a tabular format and in a knowledge graph.

## Deployment on GCP
The API was first deployed on Google Cloud Platform's App Engine service, which provides Platform as a Service (PaaS) where the application can be managed without the complexity of building infrastructure like networks, servers, operating system and such. We just have to submit the deployment code and everything is managed automatically. However, App Engine does not currently support GPUs which caused the run-times of the models to be very high. 

Due to the lack of GPU support in App Engine, the API and the front-end website was then deployed on GCP Compute Engine, which provides Infrastructure as a Service (IaaS). On Compute Engine, everything from installing an operating system, building a web server, managing networks, obtaining certificates and domain names, and managing load balancing was done by us. The final website can be accessed on [ehr-info.ml](http://ehr-info.ml)

# References

[1] Electronic Health Records: [https://www.cms.gov/Medicare/E-Health/EHealthRecords](https://www.cms.gov/Medicare/E-Health/EHealthRecords)

[2] Adverse Drug Events: [https://www.cdc.gov/medicationsafety/adult_adversedrugevents.html](https://www.cdc.gov/medicationsafety/adult_adversedrugevents.html)

[3] Conditional Random Fields: [https://medium.com/ml2vec/overview-of-conditional-random-fields-68a2a20fa541](https://medium.com/ml2vec/overview-of-conditional-random-fields-68a2a20fa541)

[4] Guillaume Genthial's Blog: [https://guillaumegenthial.github.io/](https://guillaumegenthial.github.io/)

[5] PyTorch-ELMo-BiLSTM-CRF implementation: [https://github.com/yongyuwen/PyTorch-Elmo-BiLSTMCRF](https://github.com/yongyuwen/PyTorch-Elmo-BiLSTMCRF)

[6] ScispaCy: [https://allenai.github.io/scispacy/](https://allenai.github.io/scispacy/)

[7] HuggingFace Transformers: [https://huggingface.co/transformers/](https://huggingface.co/transformers/)

[8] DMIS Lab - BioBERT PyTorch: [https://github.com/dmis-lab/biobert-pytorch/tree/master/named-entity-recognition](https://github.com/dmis-lab/biobert-pytorch/tree/master/named-entity-recognition)

[9] FastAPI: [https://fastapi.tiangolo.com/](https://fastapi.tiangolo.com/)

[10] Gunicorn: [https://gunicorn.org/](https://gunicorn.org/)

[11] jQuery AJAX Method: [https://api.jquery.com/Jquery.ajax/](https://api.jquery.com/Jquery.ajax/)
