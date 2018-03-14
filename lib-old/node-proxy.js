const nodeHandlers = {

}


module.exports = {
  create(node) { return new Proxy(node, nodeHandlers); }
}
