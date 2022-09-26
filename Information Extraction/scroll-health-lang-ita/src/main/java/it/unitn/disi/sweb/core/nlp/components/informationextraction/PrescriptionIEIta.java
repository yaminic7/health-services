package it.unitn.disi.sweb.core.nlp.components.informationextraction;

import it.unitn.disi.sweb.core.nlp.model.NLText;
import it.unitn.disi.sweb.core.nlp.parameters.NLPParameters;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static it.unitn.disi.sweb.core.nlp.pipelines.SCROLLPipeline.PARAGRAPH_DELIMITER;

@Service("PrescriptionIEIta")
public class PrescriptionIEIta<T extends NLPParameters> extends PrescriptionIE<T> {

    private final Logger logger = LoggerFactory.getLogger(PrescriptionIEIta.class);

    @Override
    public ArrayList<IEDataType> postProcess(ArrayList<IEDataType> toolOutput)
    {
        //toolOutput = super.postProcess(toolOutput);
        logger.info("In the PrescriptionIEIta class");

        for(int i=0;i<toolOutput.size();i++)
        {
            if((toolOutput.get(i).text.contains("NOTE")|toolOutput.get(i).text.contains(" NOTE")) && (toolOutput.get(i).text.matches("\\(.*\\)[,;.:]*\\s*.*")))
            {
                // System.out.println("NOTE: before" + toolOutput.get(i).text +":" + toolOutput.get(i).startIndex + ":" + toolOutput.get(i).endIndex);
                int lastIndex = toolOutput.get(i).text.lastIndexOf(" ");

                if(toolOutput.get(i).text.substring(0,lastIndex).matches("\\(.*\\)[,;\\.:]+"))
                {
                    toolOutput.get(i).setStartIndex(toolOutput.get(i).startIndex+1);
                    toolOutput.get(i).setEndIndex(toolOutput.get(i).endIndex-2);
                }
                if(toolOutput.get(i).text.substring(0,lastIndex).matches("\\(.*\\)"))
                {
                    toolOutput.get(i).setStartIndex(toolOutput.get(i).startIndex+1);
                    toolOutput.get(i).setEndIndex(toolOutput.get(i).endIndex-1);
                }
            }
        }
        //ArrayList<IEDataType> postSplit2 = splitAnnotations(toolOutput);
        ArrayList<IEDataType> postSplit = splitAnnotations(toolOutput);
        ArrayList<IEDataType> postSplit2 =super.postProcess(postSplit);

        return postSplit2;
    }

    private ArrayList<IEDataType> splitAnnotations(ArrayList<IEDataType> postProcessLang)
    {
        logger.info("Splitting the text and retrieve only annotation (text can be used when required based on the indices)");
        //for the final list to be returned
        ArrayList<IEDataType> newPrescriptionList = new ArrayList<>();

        for(int i =0;i<postProcessLang.size();i++)
        {
            ArrayList<String> AnnotationTags =new ArrayList<String>(
                    Arrays.asList(" DRUG", " STR"," FOR"," DOS"," FRE"," NOTE", " STOP"));
            String entity = "";
            String textAnnotation ="";

            try{
                entity = postProcessLang.get(i).text.substring(postProcessLang.get(i).text.lastIndexOf(" "));
                textAnnotation = postProcessLang.get(i).text.substring(0,postProcessLang.get(i).text.lastIndexOf(" "));
                textAnnotation = textAnnotation.trim();

                // System.out.println(entity +"="+ textAnnotation);

            }catch (Exception e)
            {
                entity = "Not annotated";
            }
            if(AnnotationTags.contains(entity))
            { if(entity.contains("DRUG")) //drug ingredient and drug product
            {
                String[] drug_components;
                if((textAnnotation.contains(" (")|textAnnotation.contains("(")) && (textAnnotation.contains(" )")|textAnnotation.contains(")")))
                {
                    drug_components = textAnnotation.split("\\("); //maybe include limit
                    String drug_ingredient=drug_components[0];
                    drug_ingredient = drug_ingredient.trim();
                    drug_ingredient = drug_ingredient.replace(", ",",");
                    String product_name=drug_components[1];
                    product_name = product_name.trim();

                    if(drug_ingredient.isEmpty())
                    {
                        newPrescriptionList.add(new IEDataType(" DrugIngredient",0,0));
                        newPrescriptionList.add(new IEDataType("("+product_name+ " DrugProduct",postProcessLang.get(i).startIndex+1,postProcessLang.get(i).endIndex));
                    }
                    else
                    {
                        newPrescriptionList.add(new IEDataType(drug_ingredient+" DrugIngredient",postProcessLang.get(i).startIndex,postProcessLang.get(i).startIndex+drug_ingredient.length()));
                        if(drug_ingredient.startsWith(",") | drug_ingredient.contains(",") | drug_ingredient.startsWith(".") )
                            newPrescriptionList.add(new IEDataType("("+product_name + " DrugProduct",postProcessLang.get(i).startIndex+drug_ingredient.length()+1,postProcessLang.get(i).startIndex+drug_ingredient.length()+product_name.length()));
                        else
                            newPrescriptionList.add(new IEDataType("("+product_name + " DrugProduct",postProcessLang.get(i).startIndex+drug_ingredient.length()+2,postProcessLang.get(i).startIndex+drug_ingredient.length()+product_name.length()+1));
                    }
                }
                else //no products
                {
                    String drug = textAnnotation;
                    drug = drug.trim();
                    if(drug.startsWith(PARAGRAPH_DELIMITER))
                        drug=drug.substring(1);
                    if(textAnnotation.startsWith(","))
                    {
                        newPrescriptionList.add(new IEDataType(drug+" DrugIngredient",postProcessLang.get(i).startIndex+1,postProcessLang.get(i).endIndex));
                        newPrescriptionList.add(new IEDataType(drug+" DrugProduct",postProcessLang.get(i).startIndex+1,postProcessLang.get(i).endIndex));
                    }
                    else
                    {
                        newPrescriptionList.add(new IEDataType(drug+" DrugIngredient",postProcessLang.get(i).startIndex,postProcessLang.get(i).endIndex));
                        newPrescriptionList.add(new IEDataType(drug+" DrugProduct",postProcessLang.get(i).startIndex,postProcessLang.get(i).endIndex));
                    }
                }
            }
            else if(entity.contains("STR")) //strength value, strength unit
            {
                if(textAnnotation.substring(textAnnotation.length()-1).matches("[/\\)\\(]"))
                    postProcessLang.get(i).setEndIndex(postProcessLang.get(i).endIndex-1);

                String[] strength = new String[0];
                String[] strengthOnly = new String[0];
                String strengthValueOnly = "";
                if(!textAnnotation.contains(" "))
                {   //in case the strength is as 75mg
                    if(textAnnotation.matches("[0-9]+[a-z]+"))
                        //strength = textAnnotation.split("\\s*[0-9]+\\s*");
                        strength = textAnnotation.split("(?<=\\d)(?=\\D)");
                    else if(textAnnotation.matches(" .* [0-9]+]"))
                    {
                        strengthOnly = textAnnotation.split("[0-9]+]");
                    }
                    //in case of the strength 75
                    else
                        strengthValueOnly = textAnnotation;
                }
                else
                {
                    if(textAnnotation.matches(" .* [0-9]+]"))
                        strengthOnly = textAnnotation.split("[0-9]+]");
                    else
                        strength = textAnnotation.split(" ");
                }
                try {
                    strength[1] = strength[1].trim();
                    newPrescriptionList.add(new IEDataType(strength[0]+" StrengthValue",postProcessLang.get(i).startIndex,postProcessLang.get(i).startIndex+strength[0].length()));
                    newPrescriptionList.add(new IEDataType(strength[1]+" StrengthUnit",postProcessLang.get(i).startIndex+strength[0].length(),postProcessLang.get(i).startIndex+strength[0].length()+1+strength[1].length()));
                }catch (Exception e)
                {
                    //example:  3.75 Strength (strength value and unit are same) or even for the case as 2 puff
                    if(strengthOnly.length==0)
                    {
                        newPrescriptionList.add(new IEDataType(strengthValueOnly+" StrengthValue",postProcessLang.get(i).startIndex,postProcessLang.get(i).endIndex));
                        //newPrescriptionList.add(new IEDataType(" StrengthUnit",0,0));
                    }
                    else
                    {
                        newPrescriptionList.add(new IEDataType(strengthOnly[1]+" StrengthValue",postProcessLang.get(i).startIndex,postProcessLang.get(i).endIndex));
                        //newPrescriptionList.add(new IEDataType(" StrengthUnit",0,0));
                    }
                }
            }
            else if(entity.contains("DOS"))
            {
                if(textAnnotation.matches("[0-9]+[a-z]+") | textAnnotation.matches("[0-9]+\\/[0-9]+[a-z]+[0-9]*") | textAnnotation.matches("[0-9][a-z]+[0-9]+"))
                {   int ch = textAnnotation.indexOf('c');
                    newPrescriptionList.add(new IEDataType(textAnnotation.substring(0,ch) + " Dosage",postProcessLang.get(i).startIndex,postProcessLang.get(i).startIndex+textAnnotation.substring(0,ch).length()));

                    if(textAnnotation.substring(ch-1).contains("x"))
                    {
                        int x = textAnnotation.indexOf('x');
                        //System.out.println("case with c and x:" + "dosage=" + textAnnotation.substring(0,ch) + "form=" + textAnnotation.substring(ch-1,x) + "freq=" +  textAnnotation.substring(x));

                        //System.out.println("form:1=" + textAnnotation.substring(ch-1,x));
                        newPrescriptionList.add(new IEDataType(textAnnotation.substring(ch-1,x) + " Form",postProcessLang.get(i).startIndex+textAnnotation.substring(0,ch).length()+textAnnotation.substring(ch-1,x).length()-2,postProcessLang.get(i).endIndex-textAnnotation.substring(x).length()));
                        newPrescriptionList.add(new IEDataType(textAnnotation.substring(x)+" Frequency",postProcessLang.get(i).endIndex-textAnnotation.substring(x).length()+1,postProcessLang.get(i).endIndex));
                        //newPrescriptionList.add(new IEDataType(" PeriodUnit",0,0));
                    }
                    //does not contain x : 2c
                    else
                    {
                        newPrescriptionList.add(new IEDataType(textAnnotation.substring(ch) + " Form",postProcessLang.get(i).startIndex+textAnnotation.substring(0,ch).length(),postProcessLang.get(i).endIndex));
                    }
                }
                //usual dosage ex: 1 or 1/2
                else
                {
                    newPrescriptionList.add(new IEDataType(textAnnotation+ " Dosage",postProcessLang.get(i).startIndex,postProcessLang.get(i).endIndex));
                }

            }
            //any other entity Stop Drug, Note
            else if(entity.contains("FOR"))
            {
                if(textAnnotation.substring(textAnnotation.length()-1).matches("[/)(]"))
                    postProcessLang.get(i).setEndIndex(postProcessLang.get(i).endIndex-1);
                newPrescriptionList.add(new IEDataType(textAnnotation+ " Form",postProcessLang.get(i).startIndex,postProcessLang.get(i).endIndex));

            }
            else if(entity.contains("FRE")) //frequency, period, periodUnit
            {
                //to check if the frequency annotation ends with ;
                if(textAnnotation.contains(";"))
                    postProcessLang.get(i).endIndex = postProcessLang.get(i).endIndex-1;

                if(textAnnotation.contains("/") | textAnnotation.contains(" /")) //ex: /die 2/die
                {
                    String[] partial_frequency1;
                    try{
                        partial_frequency1 = new String[]{textAnnotation.substring(0, textAnnotation.lastIndexOf("/")-1), textAnnotation.substring(textAnnotation.lastIndexOf("/"))};

                        if(partial_frequency1[0].startsWith("x"))
                            newPrescriptionList.add(new IEDataType(partial_frequency1[0]+" Frequency",postProcessLang.get(i).startIndex+1,postProcessLang.get(i).startIndex+partial_frequency1[0].length()+1));
                        else
                            newPrescriptionList.add(new IEDataType(partial_frequency1[0]+" Frequency",postProcessLang.get(i).startIndex,postProcessLang.get(i).startIndex+partial_frequency1[0].length()+1));
                        newPrescriptionList.add(new IEDataType(partial_frequency1[1]+" PeriodUnit",postProcessLang.get(i).startIndex+1+partial_frequency1[0].length()+1,postProcessLang.get(i).endIndex));

                    }catch (Exception e)
                    {   //frequency is not /jour or /j
                       // newPrescriptionList.add(new IEDataType(" Frequency",0,0));
                        newPrescriptionList.add(new IEDataType(textAnnotation.substring(1)+" PeriodUnit",postProcessLang.get(i).startIndex+1,postProcessLang.get(i).endIndex));
                    }
                }
                //frequency is not /die or /sett and also handles the case where the frequency contains x
                else
                {
                    if(textAnnotation.matches(".*[x].*"))
                    {
                        if(textAnnotation.equals("x")|textAnnotation.equals(" x")|textAnnotation.equals("x ")|textAnnotation.equals(" x "))
                            continue;
                        //int x = textAnnotation.indexOf('x');
                        String[] partial_frequency1 = textAnnotation.split("x");
                    /*    System.out.println("freq:[0] =" + partial_frequency1[0]);
                        System.out.println("freq:[1] =" + partial_frequency1[1]);*/

                        if(partial_frequency1[0].matches("\\s*") || partial_frequency1[0].matches(" ") || partial_frequency1[0].matches(""))
                        {
                            if(partial_frequency1[1].matches("\\s*[0-9]+\\s*[a-z]+."))
                            {
                                String fre[] = partial_frequency1[1].split("(?<=\\d)(?=\\D)"); //ex: 37die (with or without space)
                                /*System.out.println("fre:[0] =" + fre[0]);
                                System.out.println("fre:[1] =" + fre[1]);*/
                                newPrescriptionList.add(new IEDataType(fre[0]+" Frequency",postProcessLang.get(i).startIndex+1,postProcessLang.get(i).startIndex+fre[0].length()+1));
                                newPrescriptionList.add(new IEDataType(fre[1]+" PeriodUnit",postProcessLang.get(i).endIndex-fre[1].length()+1,postProcessLang.get(i).endIndex));
                            }
                            else
                            {
                                newPrescriptionList.add(new IEDataType(partial_frequency1[1]+" Frequency",postProcessLang.get(i).startIndex+1,postProcessLang.get(i).endIndex));
                                //newPrescriptionList.add(new IEDataType(" PeriodUnit",0,0));
                            }
                        }
                        else
                        {
                            newPrescriptionList.add(new IEDataType(partial_frequency1[0]+" Frequency",postProcessLang.get(i).startIndex,postProcessLang.get(i).startIndex+partial_frequency1[0].length()));
                            newPrescriptionList.add(new IEDataType(partial_frequency1[1]+" PeriodUnit",postProcessLang.get(i).endIndex-partial_frequency1[1].length(),postProcessLang.get(i).endIndex));
                        }
                    }
                    //no x but only a number or 2c
                    else
                    {
                        if(textAnnotation.contains("c"))
                        {   //System.out.println("form:" + textAnnotation.substring(1));
                            newPrescriptionList.add(new IEDataType(textAnnotation.substring(1) + " Form",postProcessLang.get(i).startIndex+1,postProcessLang.get(i).endIndex));
                            newPrescriptionList.add(new IEDataType(textAnnotation.substring(0,1)+" Frequency",postProcessLang.get(i).startIndex,postProcessLang.get(i).startIndex+1));
                            //newPrescriptionList.add(new IEDataType(" PeriodUnit",0,0));
                        }
                        else
                        {
                            newPrescriptionList.add(new IEDataType(textAnnotation+" Frequency",postProcessLang.get(i).startIndex,postProcessLang.get(i).startIndex+textAnnotation.length()));
                           // newPrescriptionList.add(new IEDataType(" PeriodUnit",0,0));
                        }
                    }
                }
            }

            else if(entity.contains("STOP"))
                newPrescriptionList.add(new IEDataType(textAnnotation+ " StopDrug",postProcessLang.get(i).startIndex,postProcessLang.get(i).endIndex));
            else if(entity.contains("NOTE"))
            {
                if(textAnnotation.contains(PARAGRAPH_DELIMITER))
                {
                    String[] parts = textAnnotation.split(PARAGRAPH_DELIMITER);
                    //System.out.println("in the note with delimiter" + parts[0] +": length="+postProcessLang.get(i).startIndex+parts[0].length() +":"+parts[1]);
                    newPrescriptionList.add(new IEDataType(parts[0] + " Note",postProcessLang.get(i).startIndex,postProcessLang.get(i).startIndex+parts[0].length()));
                    newPrescriptionList.add(new IEDataType(PARAGRAPH_DELIMITER+" PARAGRAPH_DELIMITER",postProcessLang.get(i).startIndex+parts[0].length(),postProcessLang.get(i).startIndex+parts[0].length()+1));
                    newPrescriptionList.add(new IEDataType(parts[1] + " Note",postProcessLang.get(i).endIndex-parts[1].length(),postProcessLang.get(i).endIndex));
                }
                newPrescriptionList.add(new IEDataType(textAnnotation+ " Note",postProcessLang.get(i).startIndex,postProcessLang.get(i).endIndex));
            }
            }
            //not annotated text
            else
            {
                if(postProcessLang.get(i).text.contains(PARAGRAPH_DELIMITER) && postProcessLang.get(i).text.length()>2)
                {
                    String[] parts = textAnnotation.split(PARAGRAPH_DELIMITER);
                    try{
                        if(!parts[0].matches(PARAGRAPH_DELIMITER) && !parts[0].matches("\\s+"))
                            newPrescriptionList.add(new IEDataType(parts[0] + " ",postProcessLang.get(i).startIndex,postProcessLang.get(i).startIndex+parts[0].length()));
                        //  System.out.println("not annotated" + parts[0] +": length="+postProcessLang.get(i).startIndex+parts[0].length());

                        newPrescriptionList.add(new IEDataType(PARAGRAPH_DELIMITER+" PARAGRAPH_DELIMITER",postProcessLang.get(i).startIndex+parts[0].length(),postProcessLang.get(i).startIndex+parts[0].length()+1));

                        if(!parts[1].matches(PARAGRAPH_DELIMITER) && !parts[1].matches("\\s+"))
                            newPrescriptionList.add(new IEDataType(parts[1] + " ",postProcessLang.get(i).endIndex-parts[1].length(),postProcessLang.get(i).endIndex));
                        //System.out.println("not annotated" + parts[1] +": length="+postProcessLang.get(i).startIndex+parts[1].length());
                    }catch (Exception e)
                    { }
                }
                //contains only the paragraph delimiter
                if(postProcessLang.get(i).text.matches(PARAGRAPH_DELIMITER))
                    newPrescriptionList.add(new IEDataType(postProcessLang.get(i).text+" PARAGRAPH_DELIMITER",postProcessLang.get(i).startIndex,postProcessLang.get(i).endIndex));

                if(!(postProcessLang.get(i).text.isEmpty()| postProcessLang.get(i).text.contains(PARAGRAPH_DELIMITER)| postProcessLang.get(i).text.matches(" ")| postProcessLang.get(i).text.matches("\\w")| postProcessLang.get(i).text.matches("\\s*")| postProcessLang.get(i).text.equals(",") | postProcessLang.get(i).text.equals("+")  | postProcessLang.get(i).text.equals("-") | postProcessLang.get(i).text.equals(":")))
                    newPrescriptionList.add(new IEDataType(postProcessLang.get(i).text + " ",postProcessLang.get(i).startIndex,postProcessLang.get(i).endIndex));
            }
        }

        //edit the index of the last element in the newPrescription list
        String last = newPrescriptionList.get(newPrescriptionList.size()-1).text;
        int lastIndex = newPrescriptionList.get(newPrescriptionList.size()-1).endIndex;
        if(newPrescriptionList.get(newPrescriptionList.size()-1).text.substring(0,last.lastIndexOf(" ")).endsWith("."))
            newPrescriptionList.get(newPrescriptionList.size()-1).setEndIndex(lastIndex-1);


/*
        for(int t = 0; t<newPrescriptionList.size(); t++)
            System.out.println("test: " + newPrescriptionList.get(t).text + " start = " + newPrescriptionList.get(t).startIndex + " end =" + newPrescriptionList.get(t).endIndex);
*/

        return newPrescriptionList;
    }
}
