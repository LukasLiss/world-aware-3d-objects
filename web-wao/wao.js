class State{
    constructor(name){
        this.name = name;
        this.animations = [];
        this.transitionDict = {}; //Key is eventID and value is resulting Stage
    }

    getAnimations(){
        return  this.animations;
    }

    addAnimation(anim){
        this.animations.push(anim);
    }

    addTransition(evID, target){
        this.transitionDict[evID] = target;
    }

    resultOfEvent(evID){
        for(var key in this.transitionDict){
            if(key == evID){
                return this.transitionDict[key];
            }
        }
        return this;
    }
}

class WAO {
    constructor(){
        this.states = []
        this.startStage = null;
        this.currentState = null;
        //three.js utilities
        this.mixer = null

        this.changeCallback = null;
    }

    getStates(){
        return this.states;
    }

    getTransitions(){
        let allTransitions = [];
        for(var i=0; i < this.states.length; i++){
            for(var evID in this.states[i].transitionDict){
                allTransitions.push([this.states[i], evID, this.states[i].transitionDict[evID]]);
            }
        }
        return allTransitions;
    }

    setChangeCallback(callback){
        this.changeCallback = callback;
    }

    setMixer(mix){
        this.mixer = mix;
    }

    addState(name, animations){
        let newState = new State(name);
        animations.map(anim => {
            newState.addAnimation(anim);
        })
        this.states.push(newState);

        console.log(newState);

        if(this.currentState == null){
            this.changeState(this.states[0]);
        }

        if(this.changeCallback != null){
            this.changeCallback({
                states: [newState.name],
                transitions: []
            });
        }
    }

    addTransition(evID, sourceName, targetName){
        let source, target;
        for(var i = 0; i < this.states.length; i++){
            if(this.states[i].name == sourceName){
                source = this.states[i];
            }
            if(this.states[i].name == targetName){
                target = this.states[i];
            }
        }
        
        console.log("ADD TRANSITION");
        console.log(sourceName);
        console.log(targetName);
        console.log(this.states);
        console.log(source);
        console.log(target);
        source.addTransition(evID, target);

        if(this.changeCallback != null){
            this.changeCallback({
                states: [],
                transitions: [[sourceName, evID, targetName]]
            });
        }
    }

    changeState(target){
        this.currentState = target;
        this.mixer.stopAllAction();

        for(var i = 0; i < target.animations.length; i++){
            const action = this.mixer.clipAction( target.animations[i] );
            console.log(target.animations);
            console.log(target.animations[i]);
            console.log(action);

            action.play();
        }

        if(this.changeCallback != null){
            this.changeCallback({
                states: [],
                transitions: []
            });
        }
    }

    eventNotification(evID){
        console.log("current:");
        console.log(this.currentState);
        console.log(evID);
        let nextState = this.currentState.resultOfEvent(evID);
        console.log("Next State");
        console.log(nextState);
        if(nextState != this.currentState){
            this.changeState(nextState);
        }
    }

}

export { WAO };