import * as d3 from "d3";
import "./viz.css";

////////////////////////////////////////////////////////////////////
////////////////////////////  Init  ///////////////////////////////
// svg
const svg = d3.select("#svg-container").append("svg").attr("id", "svg");
let width = parseInt(d3.select("#svg-container").style("width")); //정수로 폭값 설정, 안하면 픽셀로 나옴, 자바스크립트는 정수(텍스트)로 인식함
let height = parseInt(d3.select("#svg-container").style("height"));
// console.log(width + "," + height);

const margin = { top: 80, right: 50, bottom: 65, left: 50 };

// group
const g = svg
  .append("g") // group
  .attr("transform", `translate(${width / 2}, ${height / 2})`); //그룹으로 0,0기준으로 그려지는 방사형 요소의 모든 걸 svg의 중심으로 옮김

// scale
let minLen = d3.min([height / 2 - margin.top, width / 2 - margin.right]); //스케일의 기준 정하기, 폭과 높이 중 더 짧은 값을 고름(모바일,컴 차이 때문)
const radiusScale = d3.scaleLinear().domain([0, 100]).range([0, minLen]);

const attributes = [
  "Food_Quality",
  "Speed_of_Service",
  "Value_for_Money_Spent",
  "Healthy_Options",
  "Overall_Cleanliness",
  "Staff_Friendliness",
  "Curb_Appeal",
  "Atmosphere",
]; //보여주고싶은 6가지 속성 정의, 얘가 데이터가 됨
//순서대로 0,1,2,3,4,5

const angleScale = d3
  .scaleLinear()
  .domain([0, attributes.length])
  .range([0, 2 * Math.PI]);

const pointColor = "#b63400";

const radius = [0, 24, 50, 75, 100]; //원 기준 설정

// line radial
const radarLine = d3
  .lineRadial()
  // .curve(d3.curveLinearClosed)
  .curve(d3.curveCardinalClosed)
  .angle((d, i) => angleScale(i))
  .radius((d) => radiusScale(selectedBurger[d]));

// svg elements

//////////////////////////////////////////////////////////////////
////////////////////////////  Load CSV  ////////////////////////////
// data

//selectedPlayer=selectedburger
//player=burger
//selectedName=selectedname

let data = [];
let selectedBurger;
let radiusAxis, angleAxis, labels; //각도, 반지름 정의
let path;
let Burgers;
let selectedName = "Five Guys";

d3.json("data/best_burgers.json").then((raw_data) => {
  data = raw_data;
  selectedBurger = data.filter((d) => d.Brand == "Five Guys")[0];
  Burgers = [...new Set(data.map((d) => d.Brand))]; //손흥민찾기, [0]=데이터를 필터링해서 얻은 배열값이 아니라 0번째 값을 오브젝트로 반환
  // console.log(selectedCoffee);

  const dropdown = document.getElementById("options");

  //옵션
  Burgers.map((d) => {
    const option = document.createElement("option");
    option.value = d; //텍스트 의미
    option.innerHTML = d; //볼수있는 텍스트
    option.selected = d === selectedName ? true : false; //드랍다운에서 각각의 이름(d)가 selectedName이면 트루로 선택,아니면 false로
    dropdown.appendChild(option);
  });

  //이벤트발생(드랍다운 선수 선택)시 변수 바꾸기
  dropdown.addEventListener("change", function () {
    selectedName = dropdown.value;
    updateBurger(); //함수넣어주기
  });
  // console.log(selectedName);

  //axis
  radiusAxis = g
    .selectAll("radius-axis") //항목 한꺼번에 선택
    .data(radius)
    .enter()
    .append("circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", (d) => radiusScale(d))
    .attr("fill", "rgba(10,10,10,0.01)") //투명도
    .attr("stroke", "#c3c3c3")
    .attr("stroke-width", 0.5);

  angleAxis = g
    .selectAll("angle-axis") //앵글
    .data(attributes)
    .enter()
    .append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", (d, i) => getXPos(100, i)) //중심에서 끝까지 가는 축 만들어짐
    .attr("y2", (d, i) => getYPos(100, i))
    .attr("stroke", "#ccc")
    .attr("stroke-width", 0.5);

  labels = g
    .selectAll("label")
    .data(attributes)
    .enter()
    .append("text")
    .attr("x", (d, i) => getXPos(140, i)) //100보다 크면 됨
    .attr("y", (d, i) => getYPos(120, i))
    .text((d) => d)
    .attr("class", "labels");

  path = g
    .append("path")
    .datum(attributes)
    .attr("d", radarLine)
    .attr("fill", "none")
    .attr("stroke", pointColor)
    .attr("stroke-width", 1.3)
    .attr("fill", pointColor)
    .style("fill-opacity", 0.1);

  d3.select("#burger-name").text(selectedBurger.Brand); //html의 텍스트 넣어라
});

//function
const getXPos = (dist, index) => {
  //radius*cos(theta)
  return radiusScale(dist) * Math.cos(angleScale(index) - Math.PI / 2); //아는 각도에서 90도 빼야 함
};
const getYPos = (dist, index) => {
  //radius*sin(theta)
  return radiusScale(dist) * Math.sin(angleScale(index) - Math.PI / 2); //아는 각도에서 90도 빼야 함
};

//애니메이션
const updateBurger = () => {
  selectedBurger = data.filter((d) => d.Brand == selectedName)[0];

  radarLine.radius((d) => radiusScale(selectedBurger[d]));

  path.transition().duration(200).attr("d", radarLine);
  d3.select("#burger-name").text(selectedBurger.Brand);
};

//resize
window.addEventListener("resize", () => {
  width = parseInt(d3.select("#svg-container").style("width"));
  height = parseInt(d3.select("#svg-container").style("height"));
  g.attr("transform", `translate(${width / 2}, ${height / 2})`);

  //scale
  minLen = d3.min([height / 2 - margin.top, width / 2 - margin.right]);

  radiusScale.range([0, minLen]);

  //axis
  radiusAxis.attr("r", (d) => radiusScale(d));

  angleAxis
    .attr("x2", (d, i) => getXPos(100, i)) //중심에서 끝까지 가는 축 만들어짐
    .attr("y2", (d, i) => getYPos(100, i));

  //path
  radarLine.radius((d) => radiusScale(selectedBurger[d]));

  path.attr("d", radarLine);

  //label
  labels
    .attr("x", (d, i) => getXPos(116, i)) //100보다 크면 됨
    .attr("y", (d, i) => getYPos(116, i));
});
