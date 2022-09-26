package it.unitn.disi.sweb.core.nlp.components.informationextraction;

import it.unitn.disi.sweb.core.nlp.INLPParameters;
import it.unitn.disi.sweb.core.nlp.ISCROLLComponent;
import it.unitn.disi.sweb.core.nlp.model.NLText;

public interface IInformationExtraction <T extends INLPParameters> extends ISCROLLComponent<T> {

    /**
     * Process the given {@link NLText} object computing for each of the token in each sentence the
     * annotation.
     */

    @Override
    boolean run(NLText nlText, T parameters);

}
