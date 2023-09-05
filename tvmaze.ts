import axios from "axios";
import jQuery from 'jquery';

const $ = jQuery;

const $showsList = $("#showsList");
const $episodesArea = $("#episodesArea");
const $episodesList = $("#episodesList");
const $searchForm = $("#searchForm");

const BASE_URL: string = "https://api.tvmaze.com/";
const MISSING_IMAGE_URL: string = "https://tinyurl.com/tv-missing";

interface showInterface {
  id: number;
  name: string;
  summary: string;
  image: string;
}

interface showResultInterface {
  show: {
    id: number;
    name: string;
    summary: string;
    image: { medium: string; } | null;
  };
}

interface episodeInterface {
  id: number,
  name: string,
  season: string,
  number: string;
}


/** Given a search term, search for tv shows that match that query.
 *
 *  Returns (promise) array of show objects: [show, show, ...].
 *    Each show object should contain exactly: {id, name, summary, image}
 *    (if no image URL given by API, put in a default image URL)
 */
async function searchShowsByTerm(term: string): Promise<showInterface[]> {
  const response = await axios.get(`${BASE_URL}search/shows`, {
    params: { q: term }
  });
  console.log("in searchShowsByTerm response=", response);
  const data: showResultInterface[] = response.data;

  const results = data.map(result => ({
    id: result.show.id,
    name: result.show.name,
    summary: result.show.summary,
    image: result.show.image?.medium || MISSING_IMAGE_URL
  }));

  return results;
}


/** Given list of shows, create markup for each and to DOM */
function populateShows(shows: showInterface[]) {
  $showsList.empty();

  for (let show of shows) {
    const $show = $(
      `<div data-show-id="${show.id}" class="Show col-md-12 col-lg-6 mb-4">
         <div class="media">
           <img
              src="${show.image}"
              alt="${show.name}"
              class="w-25 me-3">
           <div class="media-body">
             <h5 class="text-primary">${show.name}</h5>
             <div><small>${show.summary}</small></div>
             <button class="btn btn-outline-light btn-sm Show-getEpisodes">
               Episodes
             </button>
           </div>
         </div>
       </div>
      `);

    $showsList.append($show);
  }
}


/** Handle search form submission: get shows from API and display.
 *    Hide episodes area (that only gets shown if they ask for episodes)
 */
async function searchForShowAndDisplay():Promise<void> {
  const term = $("#searchForm-term").val() as string;
  const shows = await searchShowsByTerm(term);

  $episodesArea.hide();
  populateShows(shows);
}


$searchForm.on("submit", async function (evt):Promise<void> {
  evt.preventDefault();
  await searchForShowAndDisplay();
});



/** Given a show ID, get from API and return (promise) array of episodes:
 *      { id, name, season, number }
 */
async function getEpisodesOfShow(id: number): Promise<episodeInterface[]> {

  const response = await axios.get(`${BASE_URL}shows/${id}/episodes`);
  console.log("in getEpisodesOfShow response=", response);

  const data: episodeInterface[] = response.data;
  console.log("episodes data=", data);
  const results = data.map((episode) => ({
    id: episode.id,
    name: episode.name,
    season: episode.season.toString(),
    number: episode.number.toString()
  }));

  return results;

}

/** Given list of episodes, create markup for each and to DOM */
function populateEpisodes(episodes: episodeInterface[]):void {

  $episodesList.empty();
  $episodesArea.show();

  for (let episode of episodes) {
    const $episode = $(`
      <li>
      ${episode.name} (season ${episode.season}, number ${episode.number})
      </li>
    `);
    $episodesList.append($episode);
  }
}


/** Handle click on episodes button and display the list of
 * episodes for the show
 */
async function searchForEpisodesAndDisplay(id: number):Promise<void> {

  const episodes = await getEpisodesOfShow(id);

  populateEpisodes(episodes);
}

$showsList.on("click", ".Show-getEpisodes",
  async function (evt: JQuery.ClickEvent):Promise<void> {
    const $btn = $(evt.target);
    const id = $btn.closest(".Show").data("showId");
    console.log("id=", id);
    await searchForEpisodesAndDisplay(id);
  });