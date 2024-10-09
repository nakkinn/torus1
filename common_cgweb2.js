//ver2

const PI = Math.PI;
function sin(a1){return Math.sin(a1)};
function cos(a1){return Math.cos(a1)};
function tan(a1){return Math.tan(a1)};
function sqrt(a1){return Math.sqrt(a1)};



let active_index = -1, active_canvas, active_camera, active_renderer, active_scene;


class SceneC extends THREE.Scene{

    constructor(renderer, camera){

        super();
        this.renderer = renderer;
        this.camera = camera;
        scene_group.push( this );

        if(active_index>=0){
            active_canvas.removeEventListener("pointerdown", press_updateC);
            active_canvas.removeEventListener("pointermove", mousemovment_updateC);
            // active_canvas.removeEventListener('touchmove', handleTouchMoveC); //タッチデバイスをなぞったときhandleTouchMoveを発火
            // active_canvas.removeEventListener('touchend', handleTouchEndC);   //タッチデバイスから指を離したときhandleTouchEndを発火
        }

        active_index = scene_group.length - 1;
        active_canvas = scene_group[active_index].renderer.domElement;
        active_camera = scene_group[active_index].camera;
        active_renderer = scene_group[active_index].renderer;
        active_scene = scene_group[active_index];

        active_canvas.addEventListener('pointerdown',()=>{press_updateC();});
        active_canvas.addEventListener('pointermove',(event)=>{
            mousemovment_updateC(event)
        });
        active_canvas.addEventListener('touchmove', handleTouchMoveC); //タッチデバイスをなぞったときhandleTouchMoveを発火
        active_canvas.addEventListener('touchend', handleTouchEndC);   //タッチデバイスから指を離したときhandleTouchEndを発火


        //カメラのアスペクト比の設定
        let canvas = this.renderer.domElement;
        if(camera.type == "PerspectiveCamera"){
            camera.aspect = canvas.width / canvas.height;
        }
        if(camera.type=='OrthographicCamera'){
            let aspect = canvas.width / canvas.height;
            if(canvas.width > canvas.height){
                camera.left *= aspect;
                camera.right *= aspect;
            }else{
                camera.top /= aspect;
                camera.bottom /= aspect;
            }
        }
        camera.updateProjectionMatrix();
    }

}


//#############################################################
//入力や操作
//#############################################################

let canvasover = false; //trueのときマウスホイール（2本指スライド）でグラフィックを拡大縮小、falseのときページスクロール
let twofinger = false;  //タッチパッドで2本指操作しているときtrue, そのとき回転軸を維持する
let mouseIsPressed = false; //マウスが押されている（タップ）状態か否か
let pmouseX1=-1, pmouseY1=-1, pmouseX2=-1, pmouseY2=-1; //1フレーム前のマウス（タッチ）座標　1フレーム前タッチされていなければ-1とする
let mousemovementX=0, mousemovementY=0; //マウス移動量

let rotationX=0, rotationY=0, rotationZ=0;
let dummymesh = new THREE.Mesh();



const random_vector1 = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();

let angularvelocity1 = new THREE.Vector3(0, 0, 0);  //オブジェクトの回転軸　大きさが回転速度に比例する

let myfunclist = [];    //animate関数内で行う処理

let scene_group = [];



document.querySelectorAll("canvas").forEach( canvas => {

    canvas.style.touchAction = 'none';     //スクロール禁止

    canvas.addEventListener('touchmove',(event)=>{event.preventDefault();},{passive:false});    

    canvas.addEventListener("pointerdown", ()=>{
        for(let i=0; i<scene_group.length; i++){
            if(canvas.id==scene_group[i].renderer.domElement.id && active_index!=i){

                active_canvas.removeEventListener("pointerdown", press_updateC);
                active_canvas.removeEventListener("pointermove", mousemovment_updateC);
                // active_canvas.removeEventListener('touchmove', handleTouchMoveC); //タッチデバイスをなぞったときhandleTouchMoveを発火
                // active_canvas.removeEventListener('touchend', handleTouchEndC);   //タッチデバイスから指を離したときhandleTouchEndを発火


                active_index = i;
                active_canvas = scene_group[i].renderer.domElement;
                active_camera = scene_group[i].camera;
                active_renderer = scene_group[i].renderer;
                active_scene = scene_group[i];

                angularvelocity1.set(0, 0, 0);
                pmouseX1 = -1, pmouseY1 = -1, pmouseX2 = -1, pmouseY2 = -1;
                mousemovementX = 0, mousemovementY = 0;
                mouseIsPressed = true;

                active_canvas.addEventListener('pointerdown',()=>{press_updateC();});
                active_canvas.addEventListener('pointermove',(event)=>{
                    mousemovment_updateC(event)
                });
                // active_canvas.addEventListener('touchmove', handleTouchMoveC); //タッチデバイスをなぞったときhandleTouchMoveを発火
                // active_canvas.addEventListener('touchend', handleTouchEndC);   //タッチデバイスから指を離したときhandleTouchEndを発火

                break;
            }
        }
    });

    
    canvas.addEventListener('mousemove',(event)=>{

        const size_adjust_d = 20;   //キャンバスリサイズ範囲
    
        const rect1 = event.target.getBoundingClientRect();
    
        let cw = rect1.width;
        let ch = rect1.height;
        let px = event.x - rect1.left;
        let py = event.y - rect1.top;
    
        if(cw-px<size_adjust_d && ch-py<size_adjust_d){
            document.body.style.cursor = 'nwse-resize';
        }else if(!mouseIsPressed){
            document.body.style.cursor = 'default';
        }
    
    });

    canvas.addEventListener('mouseleave',()=>{
        if(!mouseIsPressed)  document.body.style.cursor = 'default';
    });
    

});


document.addEventListener('pointerup',()=>{mouseIsPressed = false;});


function mousemovment_updateC(event){
    mousemovementX = event.movementX;
    mousemovementY = event.movementY;
}
function press_updateC(){
    mouseIsPressed = true;
}


//タッチデバイスを指でなぞったときの処理
function handleTouchMoveC(event){

    if(event.touches.length==2){    //指2本で触れている

        twofinger = true;

        if(pmouseX1==-1 || pmouseY1==-1 || pmouseX2==-1 || pmouseY2==-1){   //1フレーム前は2本指でないとき、1フレーム前の2点の座標を更新

            pmouseX1 = event.touches[0].clientX;
            pmouseY1 = event.touches[0].clientY;
            pmouseX2 = event.touches[1].clientX;
            pmouseY2 = event.touches[1].clientY;

        }else{  //1フレーム前も2本指のとき、1フレーム前と現在の2点分のタッチ座標を使ってズーム値を変更し、1フレーム前の座標を更新

            let mx1, my1, mx2, my2;
            mx1 = event.touches[0].clientX;
            my1 = event.touches[0].clientY;
            mx2 = event.touches[1].clientX;
            my2 = event.touches[1].clientY;

            let d1, d2; 
            d1 = Math.sqrt((pmouseX1-pmouseX2)**2+(pmouseY1-pmouseY2)**2);  //1フレーム前の2つのタップ箇所の距離
            d2 = Math.sqrt((mx1-mx2)**2+(my1-my2)**2);  //現在の2つのタップ箇所の距離

            active_camera.zoom += ( d2 / d1 - 1) * 1; //最後の定数を大きくすると変化が大きくなる
            
            active_camera.updateProjectionMatrix();

            pmouseX1 = mx1;
            pmouseY1 = my1;
            pmouseX2 = mx2;
            pmouseY2 = my2;

        }

    }else if(event.touches.length==1){  //指1本で触れている、1フレーム前の座標を1点分のみ更新

        if(pmouseX1==-1 || pmouseY1==-1){
            pmouseX1 = event.touches[0].clientX;
            pmouseY1 = event.touches[0].clientY;
        }else{
            mousemovementX = event.touches[0].clientX - pmouseX1;
            mousemovementY = event.touches[0].clientY - pmouseY1;
            pmouseX1 = event.touches[0].clientX;
            pmouseY1 = event.touches[0].clientY;
        }

    }
}


//タッチデバイスから指を離したときの処理
function handleTouchEndC(){
    pmouseX1 = -1;
    pmouseY1 = -1;
    pmouseX2 = -1;
    pmouseY2 = -1;
    twofinger = false;
}





//マウスホイールイベント　カメラのズーム値を変更
document.addEventListener('wheel', function(event) {

    if(canvasover){ //キャンバス操作モードのときカメラズームを調整

        //ズーム値を0.8倍または1.25倍する（0より大きい範囲で変わる）
        // if(event.deltaY > 0) active_camera.zoom *= 0.8;    
        // else active_camera.zoom *= 1.25;

        //ズーム値を+0.1または-0.1する（値が負になり得る。負のときオブジェクトは鏡像に見える）
        if(event.deltaY > 0) active_camera.zoom -= 0.1;
        else active_camera.zoom += 0.1;

        active_camera.updateProjectionMatrix();
    }

});



//キャンバス上で操作しているか否かの切り替え
document.addEventListener('mousemove', (event)=>{   //第1引数　'click'：ページをクリックすると発火, 'mousemove'：異なる要素にマウスが移動すると発火
    if(event.target.tagName.toLowerCase()=='canvas'){   //クリック位置（移動先）がキャンバス要素のとき
        canvasover = true;  //キャンバス操作オン
        document.body.style.overflow = 'hidden';    //スクロールを無効にする
    }else{   //クリック位置（移動先）がキャンバス要素でないとき
        canvasover = false;  //キャンバス操作オフ
        document.body.style.overflow = '';  //スクロールを有効にする
    }
})





//マウスプレス状態かつカーソルの種類が'nwse-resize'（左上-右下方向のリサイズ記号）のときキャンバスサイズを調整
document.addEventListener('mousemove',(event)=>{
    
    if(document.body.style.cursor=='nwse-resize' && mouseIsPressed){

        let px = Math.min(event.x, window.innerWidth);
        let py = event.y;
        let rect1 = active_canvas.getBoundingClientRect();
        active_canvas.width = (px - rect1.left) * window.devicePixelRatio;
        active_canvas.style.width = (px - rect1.left);
        active_canvas.height = (py - rect1.top) * window.devicePixelRatio;
        active_canvas.style.height = (py - rect1.top);

        active_camera.aspect = active_canvas.width / active_canvas.height;

        if(active_camera.type=='OrthographicCamera'){
            let range = Math.min(active_camera.right, active_camera.top);
            if(active_canvas.width > active_canvas.height){
                active_camera.left = - range * active_camera.aspect;
                active_camera.right = range * active_camera.aspect;
                active_camera.top = range;
                active_camera.bottom = -range;
            }else{
                active_camera.left = - range;
                active_camera.right = range;
                active_camera.top = range / active_camera.aspect;
                active_camera.bottom = - range / active_camera.aspect;
            }
        }

        active_camera.updateProjectionMatrix();

        active_renderer.setSize(active_canvas.width, active_canvas.height);
    }

});





//#############################################################
//アクションの禁止
//#############################################################


//スライダー操作時、画面スクロールが起きないようにする
document.querySelectorAll('input[type="range"]').forEach(function(input) {  
    input.style.touchAction = 'none';
});


//スマホで要素を長押しした際に、右クリックメニューが出ないようにする
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('html, body').forEach((element) => {
        element.style.userSelect = 'none';
        element.style.webkitUserSelect = 'none';
        element.style.mozUserSelect = 'none';
    });
});






function createPerspectiveCameraC(optiona){
    const defaultoption = {fov:60, near:0.01, far:500, pos:[0, -10, 0], up:[0, 0, 1], zoom:1, lookat:[0,0,0], width:400, height:400};
    optiona = {...defaultoption, ...optiona};
    let newcamera = new THREE.PerspectiveCamera(optiona.fov, optiona.width/optiona.height, optiona.near, optiona.far);
    newcamera.position.set(optiona.pos[0], optiona.pos[1], optiona.pos[2]);
    newcamera.up.set(optiona.up[0], optiona.up[1], optiona.up[2]);
    newcamera.up.normalize();
    newcamera.lookAt(optiona.lookat[0], optiona.lookat[1], optiona.lookat[2]);    //カメラが見つめる座標
    newcamera.zoom = optiona.zoom;
    newcamera.updateProjectionMatrix();
    return newcamera;
}



//平行投影カメラを追加する
function createOrthographicCameraC(optiona){
    const defaultoption = {near:0.01, far:500, pos:[0, -10, 0], up:[0, 0, 1], lookat:[0,0,0], zoom:1, range:5, width:400, height:400};
    optiona = {...defaultoption, ...optiona};
    let newcamera = new THREE.OrthographicCamera(-1, 1, 1, -1, optiona.near, optiona.far);
    
    newcamera.left = - optiona.range;
    newcamera.right = optiona.range;
    newcamera.top = optiona.range;
    newcamera.bottom = -optiona.range;
    
    newcamera.position.set(optiona.pos[0], optiona.pos[1], optiona.pos[2]);
    newcamera.up.set(optiona.up[0], optiona.up[1], optiona.up[2]);
    newcamera.up.normalize();
    newcamera.lookAt(optiona.lookat[0], optiona.lookat[1], optiona.lookat[2]);
    newcamera.zoom = optiona.zoom;
    newcamera.updateProjectionMatrix();
    return newcamera;
}




//マウスボタンをはなしたときカーソルをデフォルトのものにする
document.addEventListener('mouseup',()=>{
    document.body.style.cursor = 'default';
});





//シーンにオブジェクトを追加する    引数：シーン, 頂点リスト, ポリゴンインデックスリスト, オプション
function createMeshC(vtsa, indexa, optiona){
    
    const defaultoption = {color:0xffffff, scale:1, rotation:[0,0,0], opacity:1, visible:true, flatshade:false, wireframe:false, spherecutradius:-1, side:0,
        envMap:null, metalness:0, roughness:1, position:[0,0,0]
    }; //デフォルトのオプション
    optiona = {...defaultoption, ...optiona};   //デフォルトオプションと引数で渡されたオプションのマージ（引数のオプションを優先）

    let geometry1 = new THREE.BufferGeometry(); //ジオメトリの生成

    if(typeof eval(vtsa) == "string")   vtsa = eval(vtsa);

    if(getvalueC(optiona.spherecutradius)!=-1){ //球面カットを行う場合
        let vts_tmp = vtsa;
        if(typeof vts_tmp == "string")    vts_tmp = eval(vts_tmp);
        let vts_original = eval(vts_tmp).flat();
        let tmp = spherecutC(vts_original, tripolyC(indexa).flat(), getvalueC(optiona.spherecutradius));   //球面カット後のgraphic complexを算出
        geometry1.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vts_original.length * 2), 3));    //頂点数の2倍のサイズの配列を仮に頂点リストとして設定（後に頂点数が増えたときのために使用メモリに余裕を持たせる）
        geometry1.setIndex(new THREE.BufferAttribute(new Uint16Array(tmp[1]), 1));  //ポリゴンインデックスリストを設定
        geometry1.computeVertexNormals();   //頂点の法線ベクトル設定
        geometry1.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tmp[0]), 3));  //頂点座標の設定
        geometry1.computeVertexNormals();   //頂点の法線ベクトル設定
        
    }else{  //球面カットを行わない場合
        let vts_tmp = vtsa;
        if(typeof vts_tmp == "string")    vts_tmp = eval(vts_tmp);
        geometry1.setAttribute('position', new THREE.BufferAttribute(new Float32Array(eval(vts_tmp).flat()), 3));  //頂点座標の設定
        geometry1.setIndex(new THREE.BufferAttribute(new Uint32Array(tripolyC(indexa).flat()),1)); //ポリゴンインデックスの設定
        geometry1.computeVertexNormals();   //頂点の法線ベクトル設定
    }


    let material1 = new THREE.MeshStandardMaterial({    //マテリアルの設定
        flatShading:getvalueC(optiona.flatshade),   //フラットシェード
        color: getvalueC(optiona.color),    //色
        side:THREE.DoubleSide,
        wireframe:getvalueC(optiona.wireframe),    //ワイヤーフレーム
        transparent:true,   //透過モード
        opacity:getvalueC(optiona.opacity),  //透明度
        metalness:getvalueC(optiona.metalness),
        roughness:getvalueC(optiona.roughness),
    });

    if(optiona.side==0) material1.side = THREE.DoubleSide;
    if(optiona.side==1) material1.side = THREE.FrontSide;
    if(optiona.side==2) material1.side = THREE.BackSide;

    let mesh1 = new THREE.Mesh(geometry1, material1);   //メッシュ（ジオメトリ＋マテリアル）の生成
    mesh1.scale.set(optiona.scale, optiona.scale, optiona.scale);   //スケールの設定
    mesh1.rotation.set(optiona.rotation[0], optiona.rotation[1], optiona.rotation[2]);  //姿勢の設定
    mesh1.position.set(optiona.position[0], optiona.position[1], optiona.position[2]);
    mesh1.visible = getvalueC(optiona.visible);

    //メッシュに頂点リスト・ポリゴンインデックスリスト・オプション情報を付与（メッシュを後で更新するのに使用）
    mesh1.vtsstring = vtsa;
    if(typeof vtsa != "string") mesh1.vtsstring = JSON.stringify(vtsa);    
    mesh1.originalindex = tripolyC(indexa);
    mesh1.originalOption = optiona;
    mesh1.className = 'meshC';

    return mesh1;

}




//文字列にした変数を翻訳し、現在のその変数の値を取得する
function getvalueC(arg){
    if(typeof(arg)==='string'){
        if(arg.charAt(0)=='#')  return arg;
        return eval(arg);
    }
    return arg;
}


//多角形ポリゴンのポリゴンインデックスを三角形ポリゴンに変換してフラット
function tripolyC(list){
    let result = [];
    for(let i=0; i<list.length; i++){ //三角ポリゴンに変換
        for(let j=0; j<list[i].length-2; j++){
            result.push([list[i][0], list[i][1+j], list[i][2+j]]);
        }
    }
    return result;
}





function animateC(){
    requestAnimationFrame(animateC);

    let v1 = active_camera.getWorldDirection(new THREE.Vector3()).normalize();
    let v2 = v1.clone().cross(active_camera.up.clone());
    let v3 = v2.applyAxisAngle( v1, Math.atan2(mousemovementY,mousemovementX) - PI/2).normalize();
    v3.multiplyScalar( sqrt(mousemovementX**2 + mousemovementY**2) * 1);

    if(mouseIsPressed && !twofinger && document.body.style.cursor!='nwse-resize')  angularvelocity1.lerp(/*new THREE.Vector3(mousemovementY,mousemovementX, 0)*/ v3, 0.2);
    let axis = angularvelocity1.clone().normalize();
    let rad = angularvelocity1.length()*0.007;


    if(Math.abs(rad)<0.001) rad = 0; 

    if(active_camera.zoom < 0)    rad *= -1;

    mousemovementX = 0;
    mousemovementY = 0;

    active_scene.traverse((object)=>{
        if(object.isMesh || object.isLine){
            object.rotateOnWorldAxis(axis, rad);
        }
    });

    dummymesh.rotateOnWorldAxis(axis, rad);
    rotationX = dummymesh.rotation.x;
    rotationY = dummymesh.rotation.y;
    rotationZ = dummymesh.rotation.z;


    active_renderer.render(active_scene, active_camera);

}




//媒介変数表示で表される曲面の頂点リスト
function parametric_vtsC(func, urange, vrange, detailu, detailv){

    let umin = urange[0];
    let umax = urange[1];
    let vmin = vrange[0];
    let vmax = vrange[1];

    let result = [];

    for(let i=0; i<=detailu; i++)   for(let j=0; j<=detailv; j++){
        let u = umin + (umax - umin) / detailu * i;
        let v = vmin + (vmax - vmin) / detailv * j;
        result.push(func(u,v));
    }

    return result;
}


//媒介変数表示で表される曲面のポリゴンインデックスリスト
function parametric_indexC(detailu, detailv){
    let result = [];
    for(let i=0; i<detailu; i++)    for(let j=0; j<detailv; j++){
        result.push([i*(detailv+1)+j, i*(detailv+1)+(j+1), (i+1)*(detailv+1)+j], [(i+1)*(detailv+1)+(j+1), (i+1)*(detailv+1)+j, i*(detailv+1)+(j+1)]);
    }
    return result;
}




function tube_vts1C(plist, radius, n){

    let vts = [];

    let ring = new Array(n);

    let x1 = plist[0][0];
    let y1 = plist[0][1];
    let z1 = plist[0][2];
    let x2 = plist[1][0];
    let y2 = plist[1][1];
    let z2 = plist[1][2];

    let vr = random_vector1;
    let v1 = new THREE.Vector3(x2-x1, y2-y1, z2-z1);
    let v2 = v1.clone().cross(vr).normalize().multiplyScalar(radius);

    for(let i=0; i<n; i++){
        let v3 = v2.clone().applyAxisAngle(v1.clone().normalize(), 2*Math.PI/n*i);
        ring[i] = new THREE.Vector3(v3.x, v3.y, v3.z);
    }


    for(let i=0; i<ring.length; i++){
        vts.push([ring[i].x+x1, ring[i].y+y1, ring[i].z+z1]);
    }


    for(let k=0; k<plist.length-2; k++){

        let x1 = plist[k][0];
        let y1 = plist[k][1];
        let z1 = plist[k][2];
        let x2 = plist[k+1][0];
        let y2 = plist[k+1][1];
        let z2 = plist[k+1][2];
        let x3 = plist[k+2][0];
        let y3 = plist[k+2][1];
        let z3 = plist[k+2][2];


        let v12 = new THREE.Vector3(x1-x2, y1-y2, z1-z2);
        let v32 = new THREE.Vector3(x3-x2, y3-y2, z3-z2);
        let vc = v12.clone().cross(v32).normalize();

        let angle = v12.angleTo(v32);
        if(angle>Math.PI/2)   angle = Math.PI - angle;
        
        for(let i=0; i<ring.length; i++){
            ring[i].applyAxisAngle(vc, -angle/2);
            vts.push([ring[i].x+x2, ring[i].y+y2, ring[i].z+z2]);
            ring[i].applyAxisAngle(vc, -angle/2);
        }
    }

    for(let i=0; i<ring.length; i++){
        vts.push([ring[i].x+plist[plist.length-1][0], ring[i].y+plist[plist.length-1][1], ring[i].z+plist[plist.length-1][2]]);
    }

    return vts;


    

}


function tube1_vtsC(func, range, detail, thick, n){
    let tmp = [];
    for(let i=0; i<=detail; i++){
        let t = range[0] + (range[1]-range[0]) / detail * i;
        tmp.push(func(t));
    }
    return tube_vts1C(tmp, thick, n);
}


//u曲線の帯の集合の頂点リストを生成する
function tubeU_vtsC(func, listv, urange, detail, thick, n){

    let result = [];

    for(let k=0; k<listv.length; k++){

        let tmp = [];

        for(let i=0; i<=detail; i++){

            let u = urange[0] + (urange[1] - urange[0]) / detail * i;
            let v = listv[k];

            tmp.push( func(u,v) );
            
        }

        result = result.concat( tube_vts1C(tmp, thick, n) );
    }

    return result;
}



function tubeV_vtsC(func, listu, vrange, detail, thick, n){

    let result = [];

    for(let k=0; k<listu.length; k++){

        let tmp = [];

        for(let i=0; i<=detail; i++){

            let v = vrange[0] + (vrange[1] - vrange[0]) / detail * i;
            let u = listu[k];

            tmp.push( func(u,v) );
            
        }

        result = result.concat( tube_vts1C(tmp, thick, n) );
    }

    return result;
}



function tube_indexC(detail, n, m=1){

    let index = [];
    for(let k=0; k<m; k++)  for(let i=0; i<detail; i++)  for(let j=0; j<n; j++){
        index.push([(detail+1)*n*k+n*i+j, (detail+1)*n*k+n*i+(j+1)%n, (detail+1)*n*k+n*(i+1)+j], [(detail+1)*n*k+n*(i+1)+(j+1)%n, (detail+1)*n*k+n*(i+1)+j, (detail+1)*n*k+n*i+(j+1)%n]);
    }
    return index;
}



//u曲線の帯の集合の頂点リストを生成する
function ribbonU_vtsC(func, listv, urange, detail, width, osidasi){

    let result = [];

    for(let k=0; k<listv.length; k++){

        for(let i=0; i<=detail; i++){

            let u = urange[0] + (urange[1] - urange[0]) / detail * i;
            let v = listv[k];

            let x1 = func(u,v);
            let x2 = func(u+0.01, v);
            let x3 = func(u, v+0.01);

            let v1 = new THREE.Vector3(x2[0]-x1[0], x2[1]-x1[1], x2[2]-x1[2]).normalize();     //接線
            let v2 = new THREE.Vector3(x3[0]-x1[0], x3[1]-x1[1], x3[2]-x1[2]).normalize();

            let v3 = v1.clone().cross(v2);  //法線
            let v4 = v1.clone().cross(v3);
            
            result.push([x1[0]+v4.x*width+v3.x*osidasi, x1[1]+v4.y*width+v3.y*osidasi, x1[2]+v4.z*width+v3.z*osidasi]);
            result.push([x1[0]-v4.x*width+v3.x*osidasi, x1[1]-v4.y*width+v3.y*osidasi, x1[2]-v4.z*width+v3.z*osidasi]);

        }

    }

    return result;
}


//v曲線の帯の集合の頂点リストを生成する
function ribbonV_vtsC(func, listu, vrange, detail, width, osidasi){

    let result = [];

    for(let k=0; k<listu.length; k++){

        for(let i=0; i<=detail; i++){

            let v = vrange[0] + (vrange[1] - vrange[0]) / detail * i;
            let u= listu[k];

            let x1 = func(u, v);
            let x2 = func(u, v-0.01);
            let x3 = func(u+0.01, v);

            let v1 = new THREE.Vector3(x2[0]-x1[0], x2[1]-x1[1], x2[2]-x1[2]).normalize();     //接線
            let v2 = new THREE.Vector3(x3[0]-x1[0], x3[1]-x1[1], x3[2]-x1[2]).normalize();

            let v3 = v1.clone().cross(v2);  //法線
            let v4 = v1.clone().cross(v3);
            
            result.push([x1[0]+v4.x*width+v3.x*osidasi, x1[1]+v4.y*width+v3.y*osidasi, x1[2]+v4.z*width+v3.z*osidasi]);
            result.push([x1[0]-v4.x*width+v3.x*osidasi, x1[1]-v4.y*width+v3.y*osidasi, x1[2]-v4.z*width+v3.z*osidasi]);

        }

    }

    return result;
}


//帯の集合のポリゴンインデックスリストを生成する
function ribbon_indexC(detail, m=1){
    let result = [];
    for(let k=0; k<m; k++){
        let d1 = 2 * (detail+1) * k;
        for(let i=0; i<detail; i++){
            result.push([i*2+d1, i*2+1+d1, (i+1)*2+d1], [(i+1)*2+1+d1, (i+1)*2+d1, i*2+1+d1]);
        }
    }
    return result;
}


//球の集合の頂点リストを生成する
function points_vtsC(plist, radius){
    const ico_sphere_vts = [[ 0.000000, -1.000000, 0.000000],[ 0.723607, -0.447220, 0.525725],[ -0.276388, -0.447220, 0.850649],[ -0.894426, -0.447216, 0.000000],[ -0.276388, -0.447220, -0.850649],[ 0.723607, -0.447220, -0.525725],[ 0.276388, 0.447220, 0.850649],[ -0.723607, 0.447220, 0.525725],[ -0.723607, 0.447220, -0.525725],[ 0.276388, 0.447220, -0.850649],[ 0.894426, 0.447216, 0.000000],[ 0.000000, 1.000000, 0.000000],[ -0.162456, -0.850654, 0.499995],[ 0.425323, -0.850654, 0.309011],[ 0.262869, -0.525738, 0.809012],[ 0.850648, -0.525736, 0.000000],[ 0.425323, -0.850654, -0.309011],[ -0.525730, -0.850652, 0.000000],[ -0.688189, -0.525736, 0.499997],[ -0.162456, -0.850654, -0.499995],[ -0.688189, -0.525736, -0.499997],[ 0.262869, -0.525738, -0.809012],[ 0.951058, 0.000000, 0.309013],[ 0.951058, 0.000000, -0.309013],[ 0.000000, 0.000000, 1.000000],[ 0.587786, 0.000000, 0.809017],[ -0.951058, 0.000000, 0.309013],[ -0.587786, 0.000000, 0.809017],[ -0.587786, 0.000000, -0.809017],[ -0.951058, 0.000000, -0.309013],[ 0.587786, 0.000000, -0.809017],[ 0.000000, 0.000000, -1.000000],[ 0.688189, 0.525736, 0.499997],[ -0.262869, 0.525738, 0.809012],[ -0.850648, 0.525736, 0.000000],[ -0.262869, 0.525738, -0.809012],[ 0.688189, 0.525736, -0.499997],[ 0.162456, 0.850654, 0.499995],[ 0.525730, 0.850652, 0.000000],[ -0.425323, 0.850654, 0.309011],[ -0.425323, 0.850654, -0.309011],[ 0.162456, 0.850654, -0.499995]];
    let result = [];

    for(let i=0; i<plist.length; i++){
        let x1 = plist[i][0];
        let y1 = plist[i][1];
        let z1 = plist[i][2];
        for(let j=0; j<ico_sphere_vts.length; j++){
            result.push([ico_sphere_vts[j][0]*radius+x1, ico_sphere_vts[j][1]*radius+y1, ico_sphere_vts[j][2]*radius+z1]);
        }
    }

    return result;
}


//球の集合のポリゴンインデックスリストを生成する
function points_indexC(n){
    const ico_sphere_index = [[0,13,12],[1,13,15],[0,12,17],[0,17,19],[0,19,16],[1,15,22],[2,14,24],[3,18,26],[4,20,28],[5,21,30],[1,22,25],[2,24,27],[3,26,29],[4,28,31],[5,30,23],[6,32,37],[7,33,39],[8,34,40],[9,35,41],[10,36,38],[38,41,11],[38,36,41],[36,9,41],[41,40,11],[41,35,40],[35,8,40],[40,39,11],[40,34,39],[34,7,39],[39,37,11],[39,33,37],[33,6,37],[37,38,11],[37,32,38],[32,10,38],[23,36,10],[23,30,36],[30,9,36],[31,35,9],[31,28,35],[28,8,35],[29,34,8],[29,26,34],[26,7,34],[27,33,7],[27,24,33],[24,6,33],[25,32,6],[25,22,32],[22,10,32],[30,31,9],[30,21,31],[21,4,31],[28,29,8],[28,20,29],[20,3,29],[26,27,7],[26,18,27],[18,2,27],[24,25,6],[24,14,25],[14,1,25],[22,23,10],[22,15,23],[15,5,23],[16,21,5],[16,19,21],[19,4,21],[19,20,4],[19,17,20],[17,3,20],[17,18,3],[17,12,18],[12,2,18],[15,16,5],[15,13,16],[13,0,16],[12,14,2],[12,13,14],[13,1,14]];
    let result = [];
    for(let i=0; i<n; i++){
        for(let j=0; j<ico_sphere_index.length; j++){
            result.push([ico_sphere_index[j][0]+i*42, ico_sphere_index[j][1]+i*42, ico_sphere_index[j][2]+i*42]);
        }
    }
    return result;
}


//ポイントリストからチューブのジオメトリを生成
function makeTubeC(plist, radius, n, option=false){

    let vts = [];
    let index = [];

    let ring = new Array(n);

    let x1 = plist[0][0];
    let y1 = plist[0][1];
    let z1 = plist[0][2];
    let x2 = plist[1][0];
    let y2 = plist[1][1];
    let z2 = plist[1][2];

    let vr = random_vector1;
    let v1 = new THREE.Vector3(x2-x1, y2-y1, z2-z1);
    let v2 = v1.clone().cross(vr).normalize().multiplyScalar(radius);

    for(let i=0; i<n; i++){
        let v3 = v2.clone().applyAxisAngle(v1.clone().normalize(), 2*Math.PI/n*i);
        ring[i] = new THREE.Vector3(v3.x, v3.y, v3.z);
    }


    for(let i=0; i<ring.length; i++){
        vts.push(ring[i].x+x1, ring[i].y+y1, ring[i].z+z1);
    }


    for(let k=0; k<plist.length-2; k++){

        let x1 = plist[k][0];
        let y1 = plist[k][1];
        let z1 = plist[k][2];
        let x2 = plist[k+1][0];
        let y2 = plist[k+1][1];
        let z2 = plist[k+1][2];
        let x3 = plist[k+2][0];
        let y3 = plist[k+2][1];
        let z3 = plist[k+2][2];


        let v12 = new THREE.Vector3(x1-x2, y1-y2, z1-z2);
        let v32 = new THREE.Vector3(x3-x2, y3-y2, z3-z2);
        let vc = v12.clone().cross(v32).normalize();

        let angle = v12.angleTo(v32);
        if(angle>Math.PI/2)   angle = Math.PI - angle;
        
        for(let i=0; i<ring.length; i++){
            ring[i].applyAxisAngle(vc, -angle/2);
            vts.push(ring[i].x+x2, ring[i].y+y2, ring[i].z+z2);
            ring[i].applyAxisAngle(vc, -angle/2);
        }
    }

    for(let i=0; i<ring.length; i++){
        vts.push(ring[i].x+plist[plist.length-1][0], ring[i].y+plist[plist.length-1][1], ring[i].z+plist[plist.length-1][2]);
    }

    if(option)  return vts;


    for(let i=0; i<plist.length-1; i++) for(let j=0; j<n; j++){
        index.push(n*i+j, n*i+(j+1)%n, n*(i+1)+j, n*(i+1)+(j+1)%n, n*(i+1)+j, n*i+(j+1)%n);
    }

    let geometry1 = new THREE.BufferGeometry();
    geometry1.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vts),3));
    geometry1.computeVertexNormals();
    geometry1.setIndex(new THREE.BufferAttribute(new Uint16Array(index),1));
    geometry1.computeVertexNormals();

    //let material1 = new THREE.MeshNormalMaterial({side:THREE.DoubleSide, flatShading:false});

    //let mesh1 = new THREE.Mesh(geometry1, material1);

    return geometry1;

}

//頂点リストとポリゴンインデックスリスト、カットする球面の半径を入力、カット後のオブジェクトの頂点リスト、ポリゴンインデックスリストを出力する
function spherecutC(vtsa, indexa, r1){

    let vtsr = vtsa.concat();
    let indexr = [];

    let lista = [];

    for(let i=0; i<indexa.length; i+=3){

        let x1, x2, x3, y1, y2, y3, z1, z2, z3;
    
        x1 = vtsa[indexa[i]*3];
        y1 = vtsa[indexa[i]*3+1];
        z1 = vtsa[indexa[i]*3+2];
        x2 = vtsa[indexa[i+1]*3];
        y2 = vtsa[indexa[i+1]*3+1];
        z2 = vtsa[indexa[i+1]*3+2];
        x3 = vtsa[indexa[i+2]*3];
        y3 = vtsa[indexa[i+2]*3+1];
        z3 = vtsa[indexa[i+2]*3+2];
    
        let flag1 = x1*x1 + y1*y1 + z1*z1 <= r1*r1;
        let flag2 = x2*x2 + y2*y2 + z2*z2 <= r1*r1;
        let flag3 = x3*x3 + y3*y3 + z3*z3 <= r1*r1;

        if(((x1-x2)**2 + (y1-y2)**2 + (z1-z2)**2 < r1*r1) && ((x2-x3)**2 + (y2-y3)**2 + (z2-z3)**2 < r1*r1) && ((x3-x1)**2 + (y3-y1)**2 + (z3-z1)**2 < r1*r1)){


            if( (flag1&&!flag2&&!flag3) || (!flag1&&flag2&&flag3)){
        
                let ta = f1(x1, y1, z1, x2, y2, z2, r1);
                let tb = f1(x1, y1, z1, x3, y3, z3, r1);
        
                let m1=-1, m2=-1;
        
                for(let j=0; j<lista.length; j++){
                    if( (lista[j][0]==indexa[i]&&lista[j][1]==indexa[i+1]) || (lista[j][0]==indexa[i+1]&&lista[j][1]==indexa[i])){
                        m1 = lista[j][2];
                    }
                    if( (lista[j][0]==indexa[i]&&lista[j][1]==indexa[i+2]) || (lista[j][0]==indexa[i+2]&&lista[j][1]==indexa[i]) ){
                        m2 = lista[j][2];
                    }
                }

                if(m1==-1){
                    m1 = vtsr.length/3;
                    vtsr.push(x1*ta+x2*(1-ta), y1*ta+y2*(1-ta), z1*ta+z2*(1-ta));
                    lista.push([indexa[i], indexa[i+1], m1]);
                }
                if(m2==-1){
                    m2 = vtsr.length/3;
                    vtsr.push(x1*tb+x3*(1-tb), y1*tb+y3*(1-tb), z1*tb+z3*(1-tb));
                    lista.push([indexa[i], indexa[i+2], m2]);
                }
                
                if(flag1)   indexr.push(indexa[i], m1, m2);
                else    indexr.push(m1, indexa[i+1], indexa[i+2], m2, m1, indexa[i+2]);
            }
        
            if( (!flag1&&flag2&&!flag3) || (flag1&&!flag2&&flag3) ){
        
                let ta = f1(x2, y2, z2, x1, y1, z1, r1);
                let tb = f1(x2, y2, z2, x3, y3, z3, r1);
        
                let m1 = -1, m2 = -1;
        
                for(let j=0; j<lista.length; j++){
                    if( (lista[j][0]==indexa[i]&&lista[j][1]==indexa[i+1]) || (lista[j][0]==indexa[i+1]&&lista[j][1]==indexa[i]) ){
                        m1 = lista[j][2];
                    }
                    if( (lista[j][0]==indexa[i+1]&&lista[j][1]==indexa[i+2]) || (lista[j][0]==indexa[i+2]&&lista[j][1]==indexa[i+1])){
                        m2 = lista[j][2];
                    }
                }
        
                if(m1==-1){
                    m1 = vtsr.length/3;
                    vtsr.push(x2*ta+x1*(1-ta), y2*ta+y1*(1-ta), z2*ta+z1*(1-ta));
                    lista.push([indexa[i], indexa[i+1], m1]);
                }
                if(m2==-1){
                    m2 = vtsr.length/3;
                    vtsr.push(x2*tb+x3*(1-tb), y2*tb+y3*(1-tb), z2*tb+z3*(1-tb));
                    lista.push([indexa[i+1], indexa[i+2], m2]);
                }
                
                if(flag2)   indexr.push(m1, indexa[i+1], m2);
                else    indexr.push(indexa[i], m1, indexa[i+2], m1, m2, indexa[i+2]);
            }
        
            if( (!flag1&&!flag2&&flag3) || (flag1&&flag2&&!flag3) ){
                let ta = f1(x3, y3, z3, x1, y1, z1, r1);
                let tb = f1(x3, y3, z3, x2, y2, z2, r1);

                let m1 = -1, m2 = -1;
        
                for(let j=0; j<lista.length; j++){
                    if( (lista[j][0]==indexa[i]&&lista[j][1]==indexa[i+2]) || (lista[j][0]==indexa[i+2]&&lista[j][1]==indexa[i])){
                        m1 = lista[j][2];
                    }
                    if( (lista[j][0]==indexa[i+1]&&lista[j][1]==indexa[i+2]) || (lista[j][0]==indexa[i+2]&&lista[j][1]==indexa[i+1])){
                        m2 = lista[j][2];
                    }
                }
        
                if(m1==-1){
                    m1 = vtsr.length/3;
                    vtsr.push(x3*ta+x1*(1-ta), y3*ta+y1*(1-ta), z3*ta+z1*(1-ta));
                    lista.push([indexa[i], indexa[i+2], m1]);
                }
                if(m2==-1){
                    m2 = vtsr.length/3;
                    vtsr.push(x3*tb+x2*(1-tb), y3*tb+y2*(1-tb), z3*tb+z2*(1-tb));
                    lista.push([indexa[i+1], indexa[i+2], m2]);
                }
                
                if(flag3)   indexr.push(m1, m2, indexa[i+2]);
                else   indexr.push(indexa[i], indexa[i+1], m1, m2, m1, indexa[i+1])
            }
        
            if(flag1 && flag2 && flag3){        
                indexr.push(indexa[i], indexa[i+1], indexa[i+2]);
            }

        }
    
    }

    
    //A(x1,y1,z1)とB(x2,y2,z2)を結ぶ線分と原点中心半径r1の円の交点Ｐ, 線分ＡＢにおける点Ｐの内分比を返す
    function f1(x1, y1, z1, x2, y2, z2, r1){

        let t1, t2; //2次方程式の解2つ

        t1 = (-(x1*x2) + x2**2 - y1*y2 + y2**2 - z1*z2 + z2**2 - Math.sqrt(-4*(- (r1**2) + x2**2 + y2**2 + z2**2)*(x1**2 - 2*x1*x2 + x2**2 + y1**2 - 2*y1*y2 + y2**2 + z1**2 - 2*z1*z2 + z2**2) + 4*(-(x1*x2) + x2**2 - y1*y2 + y2**2 - z1*z2 + z2**2)**2)/2)/
        (x1**2 - 2*x1*x2 + x2**2 + y1**2 - 2*y1*y2 + y2**2 + z1**2 - 2*z1*z2 + z2**2);

        t2 = (-(x1*x2) + x2**2 - y1*y2 + y2**2 - z1*z2 + z2**2 + Math.sqrt(-4*(- (r1**2) + x2**2 + y2**2 + z2**2)*(x1**2 - 2*x1*x2 + x2**2 + y1**2 - 2*y1*y2 + y2**2 + z1**2 - 2*z1*z2 + z2**2) + 4*(-(x1*x2) + x2**2 - y1*y2 + y2**2 - z1*z2 + z2**2)**2)/2)/
        (x1**2 - 2*x1*x2 + x2**2 + y1**2 - 2*y1*y2 + y2**2 + z1**2 - 2*z1*z2 + z2**2);
        
        if(x1*x1+y1*y1+z1*z1==r1*r1){
            return 1;
        }
        if(x2*x2+y2*y2+z2*z2==r1*r1){
            return 0;
        }

        //t1,t2のうち0～1の範囲にある方の値を返す　（0.5との差が小さい方）
        if(Math.abs(t1-0.5)<Math.abs(t2-0.5))   return t1;  
        else    return t2;
    }

    return [vtsr, indexr];
}


//scene1に含まれるオブジェクトの形状を更新する
function updateObjectC(scene){

    scene.traverse((object)=>{

        if(object.className != undefined){
            //マテリアルの更新
            object.material.color.set(getvalueC(object.originalOption.color));  //色の更新
            object.material.opacity = getvalueC(object.originalOption.opacity); //透明度の更新
            object.material.flatShading = getvalueC(object.originalOption.flatshade);   //フラットシェードの設定
            object.material.roughness = getvalueC(object.originalOption.roughness);
            object.material.needsUpdate = true;
            object.material.wireframe = getvalueC(object.originalOption.wireframe);
            object.visible = getvalueC(object.originalOption.visible);
        }

        if(object.className == 'meshC'){
            //ジオメトリの更新
            if(getvalueC(object.originalOption.spherecutradius)!=-1 && object.originalOption.spherecutradius!=undefined){   //球面カットを行う場合
                let tmp = spherecutC(eval(object.vtsstring).flat(), object.originalindex.flat(), getvalueC(object.originalOption.spherecutradius)); //球面カット後の頂点リスト、ポリゴンインデックスリストを求める
                object.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tmp[0]), 3));   //頂点座標の更新
                object.geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(tmp[1]), 1));    //ポリゴンインデックスリストの更新
            }else{  //球面カットを行わない場合
                object.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(eval(object.vtsstring).flat()), 3));    //頂点座標の更新
            }

            //object.geometry.getAttribute('position').needsUpdate = true;
            object.geometry.computeVertexNormals(); //頂点の法線ベクトルの更新

        }

        if(object.className == 'ballC'){
            let tmp = eval(object.vtsstring);
            let x1 = tmp[0];
            let y1 = tmp[1];
            let z1 = tmp[2];

            for(let i=0; i<object.geometry.attributes.position.array.length; i++){
                if(i%3==0)  object.geometry.attributes.position.array[i] += -object.center_pos[0] + x1;
                if(i%3==1)  object.geometry.attributes.position.array[i] += -object.center_pos[1] + y1;
                if(i%3==2)  object.geometry.attributes.position.array[i] += -object.center_pos[2] + z1;
            }

            object.center_pos = [x1, y1, z1];

            object.geometry.getAttribute('position').needsUpdate = true;
            object.geometry.computeVertexNormals(); //頂点の法線ベクトルの更新
        }


        if(object.className == "tubeC"){
            let plist = eval(object.vtsstring);
            let vts = makeTubeC(plist, object.radius, object.originalOption.radialsegment, true);
            // console.log(vts);
            // object.geometry.attributes.position.array = new Float32Array(vts);
            // object.geometry.getAttribute('position').needsUpdate = true;
            object.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vts),3));
            object.geometry.getAttribute('position').needsUpdate = true;
            object.geometry.computeVertexNormals(); //頂点の法線ベクトルの更新
            
        }


    });


    active_canvas = scene.renderer.domElement;
    active_camera = scene.camera;
    active_renderer = scene.renderer;
    active_scene = scene;

    for(let i=0; i<scene_group.length; i++){
        if(scene_group[i].renderer.domElement.id == active_canvas.id && active_index!=i){

            active_canvas.removeEventListener("pointerdown", press_updateC);
            active_canvas.removeEventListener("pointermove", mousemovment_updateC);
            //active_canvas.removeEventListener('touchmove', handleTouchMoveC); //タッチデバイスをなぞったときhandleTouchMoveを発火
            //active_canvas.removeEventListener('touchend', handleTouchEndC);   //タッチデバイスから指を離したときhandleTouchEndを発火


            active_index = i;
            active_canvas = scene_group[i].renderer.domElement;
            active_camera = scene_group[i].camera;
            active_renderer = scene_group[i].renderer;
            active_scene = scene_group[i];

            angularvelocity1.set(0, 0, 0);
            pmouseX1 = -1, pmouseY1 = -1, pmouseX2 = -1, pmouseY2 = -1;
            mousemovementX = 0, mousemovementY = 0;
            mouseIsPressed = true;

            active_canvas.addEventListener('pointerdown',()=>{press_updateC();});
            active_canvas.addEventListener('pointermove',(event)=>{
                mousemovment_updateC(event)
            });
            //active_canvas.addEventListener('touchmove', handleTouchMoveC); //タッチデバイスをなぞったときhandleTouchMoveを発火
            //active_canvas.addEventListener('touchend', handleTouchEndC);   //タッチデバイスから指を離したときhandleTouchEndを発火

            break;
        
        }
    }
}