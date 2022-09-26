# BioBERT for NER
To train an NER model with BioBERT-v1.1 (base), run the command below.
<br>
Before running this, make sure you have generated the pre-processed dataset using the generate_data.py file with the command mentioned in the parent directory. 

## Additional Requirements
- seqeval: Used for NER evaluation (```pip install seqeval```)

## Training
```
export SAVE_DIR=./output
export DATA_DIR=./dataset

export MAX_LENGTH=128
export BATCH_SIZE=16
export NUM_EPOCHS=5
export SAVE_STEPS=1000
export SEED=0

python run_ner.py \
    --data_dir ${DATA_DIR}/ \
    --labels ${DATA_DIR}/labels.txt \
    --model_name_or_path dmis-lab/biobert-large-cased-v1.1 \
    --output_dir ${SAVE_DIR}/ \
    --max_seq_length ${MAX_LENGTH} \
    --num_train_epochs ${NUM_EPOCHS} \
    --per_device_train_batch_size ${BATCH_SIZE} \
    --save_steps ${SAVE_STEPS} \
    --seed ${SEED} \
    --do_train \
    --do_eval \
    --do_predict \
    --overwrite_output_dir
```
