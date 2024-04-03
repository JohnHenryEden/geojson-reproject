#!/usr/bin/env node
let iconv = require('iconv-lite');
let proj4 = require('proj4');
let fs = require("fs");
let path = require("path");
let reproject = require("reproject");
let epsg = require('epsg');
let argv = require('minimist')(process.argv.slice(2));
let list = [];
let dataDir = argv["data-dir"]
let sourceCrs = argv["source-crs"] || "4326"
let targetCrs = argv["target-crs"] || "3857"
let firstProjection = new proj4.Proj("EPSG:" + sourceCrs);
let secondProjection = new proj4.Proj("EPSG:" + targetCrs);
let encoding = argv["encoding"] || "gb2312"
console.log(argv)

function readAllGeojsons(dir){
	let arr = fs.readdirSync(dir);
	arr.forEach(function(item){
		let fullpath = path.join(dir,item);
		let stats = fs.statSync(fullpath);
		if(stats.isDirectory()){
			readAllGeojsons(fullpath);
		}else{
            if(fullpath.includes(".geojson") && !fullpath.includes("node")){
                let data = fs.readFileSync(fullpath);
                data = iconv.decode(data, encoding)
                data = JSON.parse(data)
                let newData = reproject.reproject(data, firstProjection, secondProjection, epsg)
                // 覆盖
                newData = JSON.stringify(newData)
                newData = iconv.encode(newData, encoding)
                if(argv["f"]){
                    fs.writeFileSync(fullpath, newData)
                }else {
                    fullpath = fullpath.replace(".geojson", targetCrs + ".geojson")
                    fs.writeFileSync(fullpath, newData)
                }
                console.log(fullpath, "已更新")
            }
		}
	});
	return list;
}

if(!dataDir){
    console.log(`
未指定输出目录。
参数说明：
--data-dir 输出目录，可以是绝对目录或相对目录，必填
--source-crs 源坐标系，EPSG编码，默认4326（WGS-84经纬度）
--target-crs 目标坐标系，EPSG编码，默认3657（WGS-84墨卡托投影）
--encoding 文件编码 默认gb2312
--f 强制覆盖更新，否则以新名称命名文件
    `)
}else {
    readAllGeojsons(dataDir);
}