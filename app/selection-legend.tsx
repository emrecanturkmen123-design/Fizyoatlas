import type {SelectionMember} from './selection-palette';
export function SelectionLegend({members}:{members:SelectionMember[]}){
 if(members.length<2)return null;
 return <section className="selection-legend" aria-label="Seçilen kasların renkleri"><h3>Modeldeki kas renkleri</h3><ol>{members.map((member,index)=><li key={member.key}><span className="selection-swatch" style={{backgroundColor:member.color}} aria-hidden="true"/><span>{index+1}. {member.name}</span></li>)}</ol></section>;
}
