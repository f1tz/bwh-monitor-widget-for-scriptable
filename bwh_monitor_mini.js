let params = getArgs();
const url = `https://api.64clouds.com/v1/getLiveServiceInfo?veid=${params.veid}&api_key=${params.apikey}`;


function getArgs() {
  return Object.fromEntries(
    args.widgetParameter
      .split("&")
      .map((item) => item.split("="))
      .map(([k, v]) => [k, decodeURIComponent(v)])
  );
}

function formatTime(time) {
  if (time < 1000000000000) time *= 1000;

  let dateObj = new Date(time);
  let year = dateObj.getFullYear();
  let month = dateObj.getMonth() + 1;
  let day = dateObj.getDate();
  return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
}

function bytesToSize(bytes) {
  if (bytes === 0) return "0B";
  let k = 1024;
  let sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i))) + sizes[i];

}

function getResetDaysLeft(reset) {
  if (!reset) return;

  let now = new Date().getTime();
  let resetTime;
  if (/^[\d.]+$/.test(reset)) {
    resetTime = parseInt(reset) * 1000;
  } else {
    resetTime = new Date(reset).getTime();
  }

  let daysLeft = Math.ceil((resetTime - now) / (1000 * 60 * 60 * 24));
  return daysLeft > 0 ? daysLeft : null;
}



let widget = new ListWidget();

let req = new Request(url);

try {
  let jsonData = await req.loadJSON();
  let used = jsonData.data_counter;
  let total = jsonData.plan_monthly_data;
  let resetday = jsonData.data_next_reset;
  let useddisk = jsonData.ve_used_disk_space_b;
  let totaldisk = jsonData.plan_disk;
  let usedram = jsonData.plan_ram - jsonData.mem_available_kb * 1024
  let totalram = jsonData.plan_ram
  let node_location_id = jsonData.node_location_id
  let hostname = jsonData.live_hostname
  let ip_addr = jsonData.ip_addresses[0]

  let title =  widget.addText(params.title ? `${params.title}` : `📦 ${hostname}`) 
  title.font = Font.boldRoundedSystemFont(16)

  widget.addSpacer()

  let content = [`📌 ${node_location_id}`];
  content.push(`🖥 ${ip_addr}`);
  content.push(`🪫 ${bytesToSize(usedram)}/${bytesToSize(totalram)}`);
  content.push(`💿 ${bytesToSize(useddisk)}/${bytesToSize(totaldisk)}`);
  content.push(`⏳ ${bytesToSize(used)}/${bytesToSize(total)}`);
  content.push(`⏱️ ${formatTime(resetday)}(${getResetDaysLeft(resetday)}d)`);



  let description = widget.addText(content.join("\n"));

  description.font = Font.mediumSystemFont(12)


  widget.presentSmall()


} catch (error) {
  console.error("Error fetching data:", error);
  widget.addText("Error fetching data");
}

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentMedium();
}

Script.complete();