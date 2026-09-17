import * as THREE from "three";
import { routedLine, surfaceLabel } from "./scene-detail";

/** Add readable service faces without implying an exact mechanical floorplan. */
export function detailRackFaces(rack: THREE.Group) {
  const assemblies: THREE.Group[]=[];
  rack.children.filter(child=>["switch-port","tray-port"].includes(child.name)).forEach(port=>{port.position.z=2.12;});
  const trays=rack.children.filter(child=>/^(compute|switch|power)-\d+$/.test(child.name));
  trays.forEach(tray=>{
    const group=new THREE.Group();group.name=`face-${tray.name}`;group.position.copy(tray.position);
    const kind=tray.name.split("-")[0];
    const metal=new THREE.MeshStandardMaterial({color:kind==="switch"?0x7996c4:kind==="power"?0x9d8059:0xaeb6a8,roughness:.55,metalness:.3});
    const plate=new THREE.Mesh(new THREE.BoxGeometry(6.85,.24,.055),metal);plate.position.z=2.05;group.add(plate);
    for(const x of [-3.18,3.18]){
      const handle=new THREE.Mesh(new THREE.BoxGeometry(.12,.22,.25),new THREE.MeshStandardMaterial({color:0x303c32,roughness:.6}));
      handle.position.set(x,0,2.18);group.add(handle);
    }
    for(let i=0;i<14;i++){
      const vent=new THREE.Mesh(new THREE.BoxGeometry(.026,.12,.018),new THREE.MeshStandardMaterial({color:0x344338}));
      vent.position.set(-2.65+i*.13,0,2.087);group.add(vent);
    }
    const marker=surfaceLabel(kind==="compute"?"COMPUTE":kind==="switch"?"NVSWITCH":"POWER",1.1,[2.12,0,2.09],kind==="switch"?"#173b99":"#26352a");
    marker.rotation.x=0;group.add(marker);rack.add(group);assemblies.push(group);
  });
  return assemblies;
}

export function rackInfrastructureRoutes(rack: THREE.Group) {
  const power=new THREE.Group();power.name="power-routes";
  const cooling=new THREE.Group();cooling.name="cooling-routes";
  const trays=rack.children.filter(child=>/^(compute|switch)-\d+$/.test(child.name));
  trays.forEach((tray,i)=>{
    const y=tray.position.y;
    power.add(routedLine([[3.2,y,-2.15],[3.2,y,2.42],[2.85,y,2.42]],0xb88744,.85));
    if(i%2===0){
      cooling.add(routedLine([[-3.15,y,-2.2],[-3.15,y,2.4],[-1.1,y,2.4]],0x2559d6,.85));
      cooling.add(routedLine([[-.8,y,2.38],[-2.7,y,2.38],[-2.7,y,-2.2]],0x548176,.85));
    }
  });
  rack.add(power,cooling);power.visible=false;cooling.visible=false;
  return {power,cooling};
}

export function attachRackSeparation(
  host: HTMLElement,
  rack: THREE.Group,
  onChange:()=>void,
) {
  const controls=document.createElement("div");controls.className="rack-layer-controls";
  controls.innerHTML='<label>Separate trays <input type="range" min="0" max="100" value="0" step="5" data-rack-separation><output>0%</output></label><span>Spacing reveals components; it does not represent service clearance. Ports and tray order are schematic.</span>';
  host.querySelector(".three-head")!.after(controls);
  const parts=rack.children.filter(child=>/^(compute|switch|power)-\d+$/.test(child.name)||child.name.startsWith("face-")||["switch-port","tray-port"].includes(child.name));
  const base=new Map(parts.map(part=>[part,part.position.y]));
  const routes=rack.children.filter(child=>["power-routes","cooling-routes","fabric-routes"].includes(child.name));
  const input=controls.querySelector<HTMLInputElement>("input")!;
  input.addEventListener("input",()=>{
    const scale=1+Number(input.value)/100*.6;
    parts.forEach(part=>{part.position.y=2.2+(base.get(part)!-2.2)*scale;});
    routes.forEach(route=>{route.scale.y=scale;route.position.y=2.2*(1-scale);});
    controls.querySelector("output")!.textContent=`${input.value}%`;
    onChange();
  });
  return {reset:()=>{input.value="0";input.dispatchEvent(new Event("input",{bubbles:true}));},setEnabled:(enabled:boolean)=>{input.disabled=!enabled;}};
}
