const { runBerfikir } = require('../plugins/berfikir');
module.exports = async (req, res) => {
  if(req.method!=='GET'&&req.method!=='POST') return res.status(405).json({error:'pake POST'});
  try{
    const body = req.method==='POST' ? req.body : {};
    const pesan   = req.method==='GET' ? req.query.pesan : body.pesan;
    const history = body.history || [];
    const result  = await runBerfikir(pesan, history);
    res.status(200).json({ok:true,...result});
  }catch(err){
    res.status(err.status||500).json({error:err.message});
  }
};
