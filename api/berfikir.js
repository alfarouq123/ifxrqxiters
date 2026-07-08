const {runBerfikir} = require('../plugins/berfikir');
module.exports = async (req,res) => {
  if(req.method!=='POST') return res.status(405).json({error:'pake POST'});
  try{
    const {pesan, history, imageUrl} = req.body||{};
    const result = await runBerfikir(pesan, history||[], imageUrl||null);
    res.status(200).json({ok:true,...result});
  }catch(err){
    res.status(err.status||500).json({error:err.message});
  }
};
