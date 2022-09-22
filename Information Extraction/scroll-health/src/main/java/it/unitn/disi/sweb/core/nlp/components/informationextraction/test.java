package it.unitn.disi.sweb.core.nlp.components.informationextraction;

import it.unitn.disi.sweb.core.nlp.model.NLMultiWord;
import it.unitn.disi.sweb.core.nlp.model.NLSentence;
import it.unitn.disi.sweb.core.nlp.model.NLText;
import it.unitn.disi.sweb.core.nlp.model.NLToken;

import java.util.List;

public class test{
    /**
     Just for the test purpose
     */
    public static void main(String args[])
    {

        PrescriptionIE IE = new PrescriptionIE();
        String text = "Annova 30000 ui 1 cpr a settimana per due mesi, poi 7000 ui 1 cpr a settimana\u2029" +
                "proseguire con Eutirox 100 mcg x 6 gg a settimana.\u2029Lasix 2c/alternate a 3 c a colazione\u2029" +
                "Entresto 24/26 1/2c x2/die\u2029Cordarone 1c/die\u2029Per il resto invariato\u2029Lanoxin 0.125 1c";
        //String text = "Metilprednisolone (Urbason) 3 mg alternato a 2 mg come da schema domiciliare.";
        NLText nlText = new NLText(text);
        nlText.setLanguage("ita");
        IE.process(nlText,null);

        //test the Semtext converter
        if (nlText == null) {
            System.out.println("Found null NLText while converting to SemText, returning empty semtext");
        }
        System.out.println("sentences: "+nlText.getSentences());
        for(NLToken nlToken:nlText.getSentences().get(0).getTokens())
        {
            System.out.println("tokens: "+nlToken.getText());
            System.out.println("token annotation: "+nlToken.getNLProp("annotations"));
            System.out.println("token drug relation: "+nlToken.getNLProp("relation"));
        }
        List<NLMultiWord> nlMultiWords = nlText.getSentences().get(0).getMultiWords();
        for(NLMultiWord mw:nlMultiWords)
        {
            System.out.println("multi words : "+mw.getTokenString() + " annotation:  " + mw.getNLProp("annotations"));
            System.out.println("multi words drug relation : " + mw.getNLProp("relation"));

        }

    }
}