package it.unitn.disi.sweb.core.nlp.components.informationextraction;

import it.unitn.disi.sweb.core.nlp.components.AbstractComponent;
import it.unitn.disi.sweb.core.nlp.model.NLMultiWord;
import it.unitn.disi.sweb.core.nlp.model.NLSentence;
import it.unitn.disi.sweb.core.nlp.model.NLText;
import it.unitn.disi.sweb.core.nlp.model.NLToken;
import it.unitn.disi.sweb.core.nlp.parameters.NLPParameters;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.support.PropertySourcesPlaceholderConfigurer;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

import static it.unitn.disi.sweb.core.nlp.pipelines.SCROLLPipeline.PARAGRAPH_DELIMITER;

@Service("InformationExtraction")
//@PropertySource("classpath:META-INF/sweb-nlp.properties")
public abstract class InformationExtraction<T extends NLPParameters> extends AbstractComponent<T> implements IInformationExtraction<T> {

    private final Logger logger = LoggerFactory.getLogger(InformationExtraction.class);

    String prefix = "IE";

    @Value("${scroll_health.ie.url}")
    private String URL_IOB;

    /**
     * 1. prepare the input (text, langauge model) for the tool
     * 2. call the tool using the JSON input
     * 3. preparing the output of the tool (mapping to common representation) CONCRETE
     * 4. post-processing the output of the tool postProcess(...) ABSTRACT
     * 5. filling in the AnnotatedText setAnnotations(...) ABSTRACT
     * 6. filling in NLText CONCRETE
     */

    @Bean
    public static PropertySourcesPlaceholderConfigurer propertyPlaceholderConfigurer() {
        return new PropertySourcesPlaceholderConfigurer();
    }
    public boolean process(NLText nlText, T parameters) {
        logger.info("In the Information Extraction class");
        IETool ieTool = new IETool();
        //to be removed
        //URL_IOB = "http://127.0.0.1:8000/get_IOB";

        //Step 1,2,3
        ArrayList<IEDataType> processed = postProcess(ieTool.InformationExtractionTool(nlText,URL_IOB)); //DONE

        //Step 4,5
        ArrayList<Annotation> annotationList = setAnnotations(processed); //DONE
        ArrayList<Annotation> annotationArrayList = setRelations(annotationList); //DONE

        //Step 6
        nlText = prepareNLText(nlText,annotationArrayList);

/*        for(NLSentence nlSentence:nlText.getSentences())
        {
            for(NLToken nlToken:nlSentence.getTokens())
            {
                System.out.println("nltoken: " + nlToken.getText());
                System.out.println("nltoken start index: " + nlToken.getNLProp("sentenceStartOffset"));
                System.out.println("nltoken end index: " + nlToken.getNLProp("sentenceEndOffset"));
            }

            for(NLMultiWord nlMultiWord:nlSentence.getMultiWords())
                System.out.println("nlmultiword: " + nlMultiWord.getText());
        }*/

        if(nlText==null)
            return false;
        else
            return true;
    }

    public abstract ArrayList<IEDataType> postProcess(ArrayList<IEDataType> toolOutput);
    public abstract ArrayList<Annotation> setRelations(ArrayList<Annotation> annotations);

    //just setting the annotations independent of domain
    public ArrayList<Annotation> setAnnotations(ArrayList<IEDataType> ieDataType) //DONE
    {
        ArrayList<Annotation> annotationList = new ArrayList<>();
        for(int i=0;i<ieDataType.size();i++)
        {
            Annotation annotation = new Annotation();
            try {
                if((ieDataType.get(i).startIndex==ieDataType.get(i+1).startIndex) && !ieDataType.get(i).text.contains("PARAGRAPH_DELIMITER") && !ieDataType.get(i).text.contains(PARAGRAPH_DELIMITER) && !ieDataType.get(i+1).text.contains(PARAGRAPH_DELIMITER) && !ieDataType.get(i+1).text.contains("PARAGRAPH_DELIMITER") && !ieDataType.get(i).text.matches("\\s+")&& !ieDataType.get(i+1).text.matches("\\s+"))
                {
                    annotation.setStartIndex(ieDataType.get(i).startIndex);
                    annotation.setEndIndex(ieDataType.get(i).endIndex);
                    ArrayList<String> tags = new ArrayList<String>();
                    if(ieDataType.get(i).text.endsWith(" ")&&!(ieDataType.get(i).text.contains(PARAGRAPH_DELIMITER)))
                        annotation.addTag(" ");
                    else
                    {
                        tags.add(prefix+":"+ieDataType.get(i).text.substring(ieDataType.get(i).text.lastIndexOf(" ") + 1));
                        tags.add(prefix+":"+ieDataType.get(i+1).text.substring(ieDataType.get(i+1).text.lastIndexOf(" ") + 1));
                        annotation.setTags(tags);
                        i = i+1;
                    }
                    //    System.out.println("annotation in if" + annotation.tags + " " + annotation.startIndex + " " +annotation.endIndex);
                }
                else //for the case where drug ingredient is not same as drug product
                {
                    annotation.setStartIndex(ieDataType.get(i).startIndex);
                    annotation.setEndIndex(ieDataType.get(i).endIndex);
                    if(ieDataType.get(i).text.endsWith(" ") && !ieDataType.get(i).text.contains("PARAGRAPH_DELIMITER") && !ieDataType.get(i).text.contains(PARAGRAPH_DELIMITER) && !ieDataType.get(i).text.matches("\\s+"))
                        annotation.addTag(" ");
                    else
                    {
                        if(ieDataType.get(i).text.substring(ieDataType.get(i).text.lastIndexOf(" ") + 1).matches("\\s*"))
                            continue;
                        else
                            annotation.addTag(prefix+":"+ieDataType.get(i).text.substring(ieDataType.get(i).text.lastIndexOf(" ") + 1));
                    }
                    //    System.out.println("annotation in else" + annotation.tags + " " + annotation.startIndex + " " +annotation.endIndex);
                }
            }catch (Exception e) //for the last item
            {
                annotation.setStartIndex(ieDataType.get(i).startIndex);
                annotation.setEndIndex(ieDataType.get(i).endIndex);
                if(ieDataType.get(i).text.endsWith(" ") && !ieDataType.get(i).text.contains("PARAGRAPH_DELIMITER") && !ieDataType.get(i).text.contains(PARAGRAPH_DELIMITER) && !ieDataType.get(i).text.matches("\\s+"))
                    annotation.addTag(" ");
                else
                //annotation.addTag(prefix+":"+ieDataType.get(i).text.substring(ieDataType.get(i).text.lastIndexOf(" ") + 1));
                {
                    if(ieDataType.get(i).text.substring(ieDataType.get(i).text.lastIndexOf(" ") + 1).matches("\\s*"))
                        continue;
                    else
                        annotation.addTag(prefix+":"+ieDataType.get(i).text.substring(ieDataType.get(i).text.lastIndexOf(" ") + 1));
                }
                // System.out.println("annotation in catch" + annotation.tags + " " + annotation.startIndex + " " +annotation.endIndex);
            }
            annotationList.add(annotation);
        }
        return annotationList;
    }

    //Step 6
    public NLText prepareNLText(NLText nlText,ArrayList<Annotation> annotationList){
        logger.info("In the Information Extraction class NL process");

        List<NLSentence> sentences = new ArrayList<NLSentence>();

        String[] texts = nlText.getText().split(PARAGRAPH_DELIMITER);
        int counter = 0;
        int correctOffset = 0;
        for(String text:texts)
        {
            if(text.equals(" ")|text.equals("") &&!(text.endsWith(PARAGRAPH_DELIMITER)))
                continue;
            NLSentence nlSentence = new NLSentence();
            nlSentence.setText(text);
            nlSentence.setNLProp("startOffset", 0);
            if(text.endsWith(PARAGRAPH_DELIMITER))
                nlSentence.setNLProp("endOffset", text.length()-1);
            else
                nlSentence.setNLProp("endOffset", text.length());
            //System.out.println("sentence:" + text);
            sentences.add(nlSentence);
        }

        //NLTokens,NlMultiwords

        for(Annotation annotation:annotationList){
            List<NLMultiWord> nlMultiWords = new ArrayList<NLMultiWord>();

            if(annotation.getTags().get(0).contains("PARAGRAPH_DELIMITER"))
            {
                counter = counter+1;
                correctOffset = annotation.getStartIndex();
                continue;
            }

            new NLToken();
            NLToken t;
            List<NLToken> nlTokens = new ArrayList<NLToken>();
            List<String> tokenStringMW = new ArrayList<String>();
            String subText = "";

            //the try block is written to handle some issues that might arise while wrong indices are provided to the annotation
            try{
                subText = nlText.getText().substring(annotation.getStartIndex(),annotation.getEndIndex());
                //  System.out.println("subtext :" + subText);
            }catch (Exception e)
            {
                //To handle the array index error
                try{
                    if(annotation.getEndIndex()<annotation.getStartIndex())
                    {
                        int diff = annotation.getStartIndex()-annotation.getEndIndex();
                        annotation.setStartIndex(annotation.getStartIndex()-diff);
                        subText = nlText.getText().substring(annotation.getStartIndex(),annotation.getEndIndex());
                    }
                    else
                        continue;
                }catch (Exception ae)
                {
                    nlText.setSentences(sentences);
                    return nlText;
                }
            }

            //remove the excess space
            subText = subText.trim();

            try{if(sentences.get(counter).getTokens().size()==0)
            {
                int rem=0;
                int s = annotation.getStartIndex();
                if(!(Math.abs(s-correctOffset)==0))
                    rem=Math.abs(s-correctOffset);

                correctOffset +=rem;
            }}catch (Exception e)
            {
                continue;
            }

            if((subText.contains("\\w") | subText.contains(" ")))
            {
                String[] partialText = subText.split(" ");
                for(int i=0;i<partialText.length;i++)
                {
                    //System.out.println("partial text :" + partialText[i]);
                    t = new NLToken(partialText[i]);

                    if(partialText[i].contains(partialText[0]))
                    {
                        t.setNLProp("sentenceStartOffset",annotation.getStartIndex()-correctOffset);
                        t.setNLProp("sentenceEndOffset",annotation.getEndIndex()+partialText[i].length()-correctOffset);
                    }
                    else
                    {
                        t.setNLProp("sentenceStartOffset",annotation.getStartIndex()+partialText[i-1].length()-correctOffset);
                        t.setNLProp("sentenceEndOffset",annotation.getEndIndex()-correctOffset);
                    }
                    t.setUsedInMultiWord(true);
                    nlTokens.add(t);
                    tokenStringMW.add(partialText[i]);
                    sentences.get(counter).addToken(t);
                }

                NLMultiWord nlMultiWord = new NLMultiWord(subText,nlTokens,tokenStringMW);
                nlMultiWord.setText(subText);
                nlMultiWord.setTokens(nlTokens);
                nlMultiWord.setTokenString(tokenStringMW);
                nlMultiWord.setNLProp("annotations",annotation.getTags()); //set the property for the NL multiword
                nlMultiWord.setNLProp("relation",annotation.getRelation());
                sentences.get(counter).getTokens().get(sentences.get(counter).getTokens().size()-1).addMultiWord(nlMultiWord);
                sentences.get(counter).getTokens().get(sentences.get(counter).getTokens().size()-2).addMultiWord(nlMultiWord);

                nlMultiWords.add(nlMultiWord);
                //test
                sentences.get(counter).addMultiWord(nlMultiWord); //adding multiword to the sentence
            }
            else
            {
                if(annotation.getTags().get(0).contains("PARAGRAPH_DELIMITER"))
                    continue;
                //for the case annotation is empty and the text also is empty
                if(subText.equals("")&&(annotation.getTags().get(0).equals(" ")))
                    continue;
                t = new NLToken(subText);
                t.setNLProp("annotations",annotation.getTags());
                t.setNLProp("relation",annotation.getRelation());
                if((annotation.getStartIndex()==annotation.getEndIndex()) &&(subText.isEmpty()))
                {
                    //it has to 0,0 annotation.getStartIndex(),annotation.getEndIndex()
                    t.setNLProp("sentenceStartOffset",0);
                    t.setNLProp("sentenceEndOffset",0);
                }
                else
                {
                    t.setNLProp("sentenceStartOffset",annotation.getStartIndex()-correctOffset);
                    t.setNLProp("sentenceEndOffset",annotation.getEndIndex()-correctOffset);
                }
                sentences.get(counter).addToken(t); //adding token to the sentence
            }
            sentences.get(counter).setMultiWords(nlMultiWords);
            nlText.addSentence(sentences.get(counter));

            //if(counter==0)
            sentences.get(counter).setNLProp("paragraphHead", true);
        }
        nlText.setSentences(sentences);
        return nlText;
    }
}