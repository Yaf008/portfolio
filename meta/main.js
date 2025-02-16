let data = [];
let commits = [];

async function loadData() {
  data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line), 
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone), 
    datetime: new Date(row.datetime),
  }));

  processCommits();
  console.log(commits);
}


document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
});


function processCommits() {
    commits = d3.groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0]; // Get the first row of the commit
  
        let { author, date, time, timezone, datetime } = first;
  
        let ret = {
          id: commit,
          url: 'https://github.com/YOUR_REPO/commit/' + commit, // Replace with your warehouse
          author,
          date,
          time,
          timezone,
          datetime,
          // Calculation hours (e.g. 14:30 = 14.5)
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          // Count the number of rows modified by the commit
          totalLines: lines.length,
        };
  
        
        Object.defineProperty(ret, 'lines', {
          value: lines,
          writable: false, 
          enumerable: false, 
          configurable: false, 
        });
  
        return ret;
      });
  }
  