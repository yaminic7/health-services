

class Edge {
    constructor(s, d, label){
        this.source = s
        this.dest = d
        this.label = label
    }
    getSource(){return this.source}
    getDest(){return this.dest}
    getLabel(){return this.label}
}

class Graph {
    constructor(){
        this.noOfnodes = 0
        this.nodes = []
        this.edges = []
    }

    addNode(v){
        this.nodes.push(v)
        this.noOfnodes += 1
    }

    addEdge(v, w, label){
        var e = new Edge(v, w, label)
        this.edges.push(e)
    }

    getEdges(){return this.edges}
    getNodes(){return this.nodes}
    getNoOfNodes(){return this.noOfnodes}

    printGraph(){
  
        // iterate over the edges
        for (let e of this.edges)
            console.log(e.source +"--("+ e.label +")->"+ e.dest)
    }
}

exports.Graph = Graph
