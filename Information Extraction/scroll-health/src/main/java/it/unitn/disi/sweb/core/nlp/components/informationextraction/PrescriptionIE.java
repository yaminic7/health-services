package it.unitn.disi.sweb.core.nlp.components.informationextraction;

import it.unitn.disi.sweb.core.nlp.model.NLText;
import it.unitn.disi.sweb.core.nlp.parameters.NLPParameters;
import net.didion.jwnl.data.Exc;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import static it.unitn.disi.sweb.core.nlp.pipelines.SCROLLPipeline.PARAGRAPH_DELIMITER;

@Service("PrescriptionIE")
public class PrescriptionIE<T extends NLPParameters> extends InformationExtraction<T>{

    private final Logger logger = LoggerFactory.getLogger(PrescriptionIE.class);
    int flag = 0;

    @Override
    public boolean process(NLText nlText, T parameters) {
        super.prefix = "Prescr";
        boolean result = super.process(nlText,parameters);
        if(result == true)
            return true;
        else
            return false;
    }

    @Override
    public ArrayList<IEDataType> postProcess(ArrayList<IEDataType> toolOutput){

        logger.info("In the PrescriptionIE class");
        /*
           Fill in the missing annotations
         */
        for(int k=0;k<toolOutput.size();k++)
        {
            //Maybe try with the circular queue
         /*   ArrayList<String> AnnotationTags = new ArrayList<String>(
                    Arrays.asList(" DrugIngredient", " DrugProduct"," StrengthValue"," StrengthUnit"," Dosage"," Form", " Frequency", " PeriodUnit", " Note", " StopDrug"));

            String entity ="";
            //System.out.println(postProcessLang.get(i).text);
            try{
                entity = toolOutput.get(k).text.substring(toolOutput.get(k).text.lastIndexOf(" "));

            }catch (Exception e)
            {
                entity = "Not annotated";
            }

            if(AnnotationTags.contains(entity))
            {}*/
            try {
                if(toolOutput.get(k).text.contains("DrugIngredient"))
                {
                    try{if(!toolOutput.get(k+1).text.contains("DrugProduct"))
                        toolOutput.add(k+1,new IEDataType(" DrugProduct",0,0));
                    }catch (Exception e){
                        toolOutput.add(k+1,new IEDataType(" DrugProduct",0,0));
                    }
                    continue;
                }

                if(toolOutput.get(k).text.contains("DrugProduct"))
                {
                    try{if(!toolOutput.get(k+1).text.contains("StrengthValue"))
                        toolOutput.add(k+1,new IEDataType(" StrengthValue",0,0));
                    }catch (Exception e){
                        toolOutput.add(k+1,new IEDataType(" StrengthValue",0,0));
                    }
                    continue;
                }
                if(toolOutput.get(k).text.contains("StrengthValue"))
                {
                    try{if(!toolOutput.get(k+1).text.contains("StrengthUnit"))
                        toolOutput.add(k+1,new IEDataType(" StrengthUnit",0,0));

                    }catch (Exception e){
                        toolOutput.add(k+1,new IEDataType(" StrengthUnit",0,0));
                    }
                    continue;
                }
                if(toolOutput.get(k).text.contains("StrengthUnit"))
                {
                    try{if(!toolOutput.get(k+1).text.contains("Dosage") & (!toolOutput.get(k+2).text.contains("Dosage")))
                        toolOutput.add(k+1,new IEDataType(" Dosage",0,0));

                    }catch (Exception e){
                        toolOutput.add(k+1,new IEDataType(" Dosage",0,0));
                    }
                    continue;
                }
                if(toolOutput.get(k).text.contains("Dosage"))
                {
                    try{if(!toolOutput.get(k+1).text.contains("Form")& (!toolOutput.get(k+2).text.contains("Form")) & !toolOutput.get(1).text.contains("Form"))
                        toolOutput.add(k+1,new IEDataType(" Form",0,0));
                    }catch (Exception e){
                        toolOutput.add(k+1,new IEDataType(" Form",0,0));
                    }
                    continue;

                }
                if (toolOutput.get(k).text.contains("Form"))
                {
                    try{if(!toolOutput.get(k+1).text.contains("Frequency") & (!toolOutput.get(k+2).text.contains("Frequency")) & !toolOutput.get(1).text.contains("Frequency"))
                        toolOutput.add(k+1,new IEDataType(" Frequency",0,0));
                    }catch (Exception e){
                        toolOutput.add(k+1,new IEDataType(" Frequency",0,0));

                    }
                    continue;
                }
                if (toolOutput.get(k).text.contains("Frequency"))
                {
                    try{if(!toolOutput.get(k+1).text.contains("PeriodUnit") & (!toolOutput.get(k+2).text.contains("PeriodUnit")) & !toolOutput.get(1).text.contains("PeriodUnit"))
                        toolOutput.add(k+1,new IEDataType(" PeriodUnit",0,0));
                    }catch (Exception e){
                        toolOutput.add(k+1,new IEDataType(" PeriodUnit",0,0));
                    }
                    continue;
                }
                if(toolOutput.get(k).text.contains("PeriodUnit"))
                {
                    try{if(!toolOutput.get(k+1).text.contains("Note") & !toolOutput.get(k+2).text.contains("Note") )
                        toolOutput.add(k+1,new IEDataType(" Note",0,0));
                    }catch (Exception e){
                        if(!toolOutput.get(0).text.contains("Note") & !toolOutput.get(1).text.contains("Note"))
                        toolOutput.add(k+1,new IEDataType(" Note",0,0));
                    }
                    continue;
                }
                if(toolOutput.get(k).text.contains("Note"))
                {
                    try{if(!toolOutput.get(k+1).text.contains("StopDrug") || !toolOutput.get(k+2).text.contains("StopDrug"))
                        toolOutput.add(k+1,new IEDataType(" StopDrug",0,0));
                    }catch (Exception e){
                        if((!toolOutput.get(0).text.contains("StopDrug") && !toolOutput.get(1).text.contains("StopDrug")) && toolOutput.size()==k+1)
                        {
                           // System.out.println("in the catch block:" + toolOutput.get(0).text.contains(" StopDrug") + toolOutput.get(1).text.contains(" StopDrug"));
                            toolOutput.add(k+1,new IEDataType(" StopDrug",0,0));
                        }
                    }
                    continue;
                }
                if(toolOutput.get(k).text.contains("StopDrug") & toolOutput.size()<10)
                {
                    try{if(!toolOutput.get(k+1).text.contains("DrugIngredient") & !toolOutput.get(k+2).text.contains("DrugIngredient"))
                        toolOutput.add(k+1,new IEDataType(" DrugIngredient",0,0));
                    }catch (Exception e){
                        toolOutput.add(k+1,new IEDataType(" DrugIngredient",0,0));
                    }
                    continue;
                }
            }catch (Exception e)
            {
                continue;
            }

        }

      /*  for(int k=1;k<toolOutput.size();k++)
            System.out.println("in the post process (PrescriptionIE): " + toolOutput.get(k).text);
*/
        return toolOutput;
    }

    @Override
    public ArrayList<Annotation> setRelations(ArrayList<Annotation> annotations)
    {
        /*
        Not always the drug product is in the beginning
        1. use another for loop to traverse the list again
        2. in case there is no drug product, then the drug product will be same as drug ingredient DONE
         */
        Annotation drugRef = new Annotation();

        //if the tags are drug_ingredient and drug_product and it is not empty
        //--------------- maybeuncomment it ---------------------

        //just for the first case where the drug product and the drug ingredient are different
        if(annotations.get(0).getTags().size()>1& !(annotations.get(0).getTags().get(0).matches("\\s*")))
        {
            annotations.get(0).addTag(annotations.get(0).getTags().get(0) + "_" + 1);
            annotations.get(0).addTag(annotations.get(0).getTags().get(1) + "_" + 1);
            annotations.get(0).getTags().remove(0);
            annotations.get(0).getTags().remove(0);
        }
        else //only one annotation of the drug_product
        {
            if(!(annotations.get(0).getTags().get(0).matches("\\s*")))
            {
                annotations.get(0).addTag(annotations.get(0).getTags().get(0) + "_" + 1);
                annotations.get(0).getTags().remove(0);
            }
        }

        for(int i=0;i<annotations.size();i++)
        {
            //resetting the counter in case Paragraph delimiter is found
            for(int k=0;k<annotations.get(i).getTags().size();k++)
                if(annotations.get(i).getTags().get(0).contains("  PARAGRAPH_DELIMITER")|annotations.get(i).getTags().get(0).contains(" PARAGRAPH_DELIMITER")|annotations.get(i).getTags().get(0).contains("PARAGRAPH_DELIMITER"))
                {
                    flag = 0;
                    continue;
                }

                else if((annotations.get(i).getTags().get(0).contains("DrugProduct") || annotations.get(i).getTags().size()>1 ) & !(annotations.get(i).getTags().get(0).contains("_") ))
                {
                    drugRef = annotations.get(i);
                    flag = 1;

                    //!(annotations.get(i).getTags().get(0) ==" ")  --- add it as & in the if statement
                    if(annotations.get(i).getTags().size()>1)
                    {
                        annotations.get(i).addTag(annotations.get(i).getTags().get(0) + "_" + flag);
                        annotations.get(i).addTag(annotations.get(i).getTags().get(1) + "_" + flag);

                        annotations.get(i).getTags().remove(0);
                        annotations.get(i).getTags().remove(0);
                    }
                    else
                    {  //if size is 1
                        if(!(annotations.get(i).getTags().get(0).contains("_")) | !(annotations.get(i).getTags().get(0).matches("[a-z]+_[0-9]")))
                        {
                            annotations.get(i).addTag(annotations.get(i).getTags().get(0) + "_" + flag);
                            annotations.get(i).getTags().remove(0);
                        }
                    }
                    flag=0;
                }
                //this is for stop drug where it is not attached to anything else
                else if(annotations.get(i).getTags().get(0).contains("StopDrug")|annotations.get(i).getTags().get(0).contains(" StopDrug"))
                {
                    flag = 1;
                    annotations.get(i).addTag(annotations.get(i).getTags().get(0) + "_" + flag);
                    annotations.get(i).getTags().remove(0);
                    annotations.get(i).setRelation(annotations.get(i).getTags().get(0));
                    flag = 0; //reset the counter after stop drug
                    continue;
                }
                //if the annotation does not contain the tag Drug product or the tag StopDrug
                else
                {
                    if((annotations.get(i).tags.get(0).contains(" DrugIngredient")|annotations.get(i).tags.get(0).contains("DrugIngredient")) & !annotations.get(i).getTags().get(0).contains("_"))
                        flag+=1;  //check
                    //later edit this part (to skip the excess _2 annotations)
                    if(flag > 1)
                        continue;
                    //System.out.println("increment the flag=" + flag);
                    try {
                        if(annotations.get(i-1).getRelation()== null && !(annotations.get(i-1).getTags().get(0).contains("PARAGRAPH_DELIMITER")))
                        //check if the previous annotation has a relation or not
                        //if not, then check for all previous annotations till there is a relation assigned and if the previous relation is not paragraph demilimiter
                        {
                            if(!annotations.get(i-1).getTags().get(0).contains("_")& !(annotations.get(i).getTags().get(0) == " "))
                            {
                                if(flag==0)
                                    flag=1;
                                String tag = annotations.get(i - 1).getTags().get(0);
                                annotations.get(i-1).addTag(tag + "_" + flag);
                                annotations.get(i-1).getTags().remove(0);
                            }
                            for(int j=i-1;j>=0;j--)
                                if(annotations.get(j).getRelation()==null)
                                {
                                    if(!annotations.get(j).getTags().get(0).contains("_")& !(annotations.get(i).getTags().get(0) ==" "))
                                    {
                                        String tag = annotations.get(j).getTags().get(0);
                                        annotations.get(j).addTag(tag + "_" + flag);
                                        annotations.get(j).getTags().remove(0);
                                    }
                                    if(drugRef.getTags().size()>1)
                                        annotations.get(j).setRelation(Collections.singleton(annotations.get(j).getTags().get(0))+" " +Collections.singleton(drugRef.getTags().get(1)));
                                    else
                                    {
                                        if(!annotations.get(j).getTags().get(0).contains("DrugProduct"))
                                            annotations.get(j).setRelation(annotations.get(j).getTags()+" " +drugRef.getTags());
                                        else
                                            annotations.get(j).setRelation(annotations.get(j).getTags().get(0));
                                    }
                                }
                                else
                                    break;
                        }
                        else {
                            if(flag==0)
                                flag=1;

                            if(!annotations.get(i).getTags().get(0).contains("_") & !(annotations.get(i).getTags().get(0) ==" "))
                            {
                                String tag = annotations.get(i).getTags().get(0);
                                annotations.get(i).addTag(tag + "_" + flag);
                                annotations.get(i).getTags().remove(0);
                            }
                            if(drugRef.getTags().size()>1)
                                annotations.get(i).setRelation(Collections.singleton(annotations.get(i).getTags().get(0))+" " +Collections.singleton(drugRef.getTags().get(1)));
                            else
                            {
                                if(!annotations.get(i).getTags().get(0).contains("DrugProduct"))
                                    annotations.get(i).setRelation(annotations.get(i).getTags()+" " +drugRef.getTags());
                                else
                                    annotations.get(i).setRelation(annotations.get(i).getTags().get(0));
                            }  } }catch (Exception e) { continue; }

                    //not annotated text should have " " relations
                    if(annotations.get(i).getTags().get(0) ==" ")
                        annotations.get(i).setRelation(" ");
                    if(!(annotations.get(i).getTags().get(0) ==" ") & !(annotations.get(i).getTags().get(0).contains("_")))
                    {
                        if(flag==0)
                            flag=1;
                        String tag = annotations.get(i).getTags().get(0);
                        annotations.get(i).addTag(tag + "_" + flag);
                        annotations.get(i).getTags().remove(0);
                        annotations.get(i).setRelation(annotations.get(i).getTags()+" "+drugRef.getTags());

                    }
                }
        }

        //for the last annotation in the list
        if(!annotations.get(annotations.size()-1).getTags().get(0).contains("_")& !(annotations.get(annotations.size()-1).getTags().get(0) ==" "))
        {
            if(flag==0)
                flag=1;
            String tag = annotations.get(annotations.size()-1).getTags().get(0);
            annotations.get(annotations.size()-1).addTag(tag + "_" + flag);
            annotations.get(annotations.size()-1).getTags().remove(0);

            if(drugRef.getTags().size()>1)
                annotations.get(annotations.size()-1).setRelation(Collections.singleton(annotations.get(annotations.size()-1).getTags().get(0))+" " +Collections.singleton(drugRef.getTags().get(1)));
            else
                annotations.get(annotations.size()-1).setRelation(annotations.get(annotations.size()-1).getTags()+" " +drugRef.getTags());

            //not annotated text should have " " relations
            if(annotations.get(annotations.size()-1).getTags().get(0) ==" ")
                annotations.get(annotations.size()-1).setRelation(" ");
        }
        return annotations;
    }
}
